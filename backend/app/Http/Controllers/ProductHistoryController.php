<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductHistory;
use Illuminate\Http\Request;

class ProductHistoryController extends Controller
{
    /**
     * Lấy lịch sử thay đổi của một sản phẩm
     */
    public function index($productId)
    {
        // Hỗ trợ cả ID thật và Hashed ID
        $realId = Product::decodeHashedId($productId);
        $productId = $realId ?? $productId;

        // Kiểm tra sản phẩm tồn tại (bao gồm cả đã xóa)
        $product = Product::withTrashed()->findOrFail($productId);

        $history = ProductHistory::where('product_id', $productId)
            ->with([
                'user:user_id,username,email',
                'user.profile:profile_id,user_id,full_name',
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'history_id' => $item->product_history_id,
                    'action' => $item->action,
                    'user' => $item->user ? [
                        'id' => $item->user->user_id,
                        'username' => $item->user->username,
                        'full_name' => $item->user->profile->full_name ?? null,
                        'email' => $item->user->email,
                    ] : null,
                    'old_values' => $item->old_values,
                    'new_values' => $item->new_values,
                    'changed_fields' => $item->changed_fields,
                    'description' => $item->description,
                    'ip_address' => $item->ip_address,
                    'created_at' => optional($item->created_at)?->format('Y-m-d H:i:s'),
                    'created_at_human' => optional($item->created_at)?->diffForHumans(),
                ];
            });

        return response()->json([
            'product' => [
                'id' => $product->product_id,
                'name' => $product->name,
                'status' => $product->trashed() ? 'deleted' : 'active',
            ],
            'history' => $history,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Lấy chi tiết một bản ghi lịch sử
     */
    public function show($historyId)
    {
        $history = ProductHistory::with([
            'user:user_id,username,email',
            'user.profile:profile_id,user_id,full_name',
            'product:product_id,name,slug'
        ])->findOrFail($historyId);

        return response()->json([
            'history_id' => $history->history_id,
            'product' => [
                'id' => $history->product->product_id,
                'name' => $history->product->name,
                'slug' => $history->product->slug,
            ],
            'action' => $history->action,
            'user' => $history->user ? [
                'id' => $history->user->user_id,
                'username' => $history->user->username,
                'full_name' => $history->user->profile->full_name ?? null,
                'email' => $history->user->email,
            ] : null,
            'old_values' => $history->old_values,
            'new_values' => $history->new_values,
            'changed_fields' => $history->changed_fields,
            'description' => $history->description,
            'ip_address' => $history->ip_address,
            'user_agent' => $history->user_agent,
            'created_at' => optional($history->created_at)?->format('Y-m-d H:i:s'),
            'created_at_human' => optional($history->created_at)?->diffForHumans(),
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Khôi phục sản phẩm về trạng thái cũ từ lịch sử
     */
    public function restoreFromHistory(Request $request, $historyId)
    {
        $history = ProductHistory::findOrFail($historyId);
        $product = Product::withTrashed()->findOrFail($history->product_id);

        // Chỉ cho phép khôi phục từ bản ghi updated
        if ($history->action !== 'updated') {
            return response()->json([
                'message' => 'Chỉ có thể khôi phục từ bản ghi cập nhật.',
            ], 400, [], JSON_UNESCAPED_UNICODE);
        }

        // Lưu giá trị hiện tại trước khi khôi phục
        $currentValues = $product->only(array_keys($history->old_values ?? []));

        // Khôi phục về giá trị cũ
        if ($history->old_values) {
            $product->update($history->old_values);
        }

        // Ghi lại hành động khôi phục
        ProductHistory::logChange(
            $product,
            'updated',
            $currentValues,
            $history->old_values,
        );

        return response()->json([
            'message' => 'Đã khôi phục sản phẩm về trạng thái trước đó thành công.',
            'data' => $product->fresh(['category', 'brand']),
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * So sánh giữa hai phiên bản
     */
    public function compare($historyId1, $historyId2)
    {
        $history1 = ProductHistory::findOrFail($historyId1);
        $history2 = ProductHistory::findOrFail($historyId2);

        // Kiểm tra cùng sản phẩm
        if ($history1->product_id !== $history2->product_id) {
            return response()->json([
                'message' => 'Chỉ có thể so sánh lịch sử của cùng một sản phẩm.',
            ], 400, [], JSON_UNESCAPED_UNICODE);
        }

        $differences = [];
        $allFields = array_unique(array_merge(
            array_keys($history1->new_values ?? []),
            array_keys($history2->new_values ?? [])
        ));

        foreach ($allFields as $field) {
            $value1 = $history1->new_values[$field] ?? null;
            $value2 = $history2->new_values[$field] ?? null;

            if ($value1 !== $value2) {
                $differences[$field] = [
                    'version_1' => $value1,
                    'version_2' => $value2,
                ];
            }
        }

        return response()->json([
            'product_id' => $history1->product_id,
            'version_1' => [
                'history_id' => $history1->product_history_id,
                'action' => $history1->action,
                'created_at' => optional($history1->created_at)?->format('Y-m-d H:i:s'),
                'user' => $history1->user?->username,
            ],
            'version_2' => [
                'history_id' => $history2->product_history_id,
                'action' => $history2->action,
                'created_at' => optional($history2->created_at)?->format('Y-m-d H:i:s'),
                'user' => $history2->user?->username,
            ],
            'differences' => $differences,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Lấy tất cả lịch sử thay đổi (cho admin)
     */
    public function all(Request $request)
    {
        $query = ProductHistory::with([
            'user:user_id,username,email',
            'user.profile:profile_id,user_id,full_name',
            'product:product_id,name'
        ])->orderBy('created_at', 'desc');

        // Lọc theo action
        if ($request->has('action') && !empty($request->action)) {
            $query->where('action', $request->action);
        }

        // Lọc theo user
        if ($request->has('user_id') && !empty($request->user_id)) {
            $query->where('user_id', $request->user_id);
        }

        // Lọc theo khoảng thời gian
        if ($request->has('from_date') && !empty($request->from_date)) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date') && !empty($request->to_date)) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Phân trang
        $perPage = $request->get('per_page', 50);
        $history = $query->paginate($perPage);

        return response()->json([
            'data' => $history->items(),
            'pagination' => [
                'current_page' => $history->currentPage(),
                'last_page' => $history->lastPage(),
                'per_page' => $history->perPage(),
                'total' => $history->total(),
            ],
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    /**
     * Thống kê lịch sử thay đổi
     */
    public function statistics()
    {
        $stats = [
            'total_changes' => ProductHistory::count(),
            'by_action' => ProductHistory::selectRaw('action, COUNT(*) as count')
                ->groupBy('action')
                ->pluck('count', 'action'),
            'today' => ProductHistory::whereDate('created_at', today())->count(),
            'this_week' => ProductHistory::whereBetween('created_at', [
                now()->startOfWeek(),
                now()->endOfWeek()
            ])->count(),
            'this_month' => ProductHistory::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'top_editors' => ProductHistory::with('user:user_id,username,full_name')
                ->selectRaw('user_id, COUNT(*) as changes_count')
                ->whereNotNull('user_id')
                ->groupBy('user_id')
                ->orderByDesc('changes_count')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    return [
                        'user' => $item->user ? [
                            'id' => $item->user->user_id,
                            'username' => $item->user->username,
                            'full_name' => $item->user->full_name,
                        ] : null,
                        'changes_count' => $item->changes_count,
                    ];
                }),
        ];

        return response()->json($stats, 200, [], JSON_UNESCAPED_UNICODE);
    }
}
