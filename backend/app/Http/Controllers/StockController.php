<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    /**
     * Danh sách tồn kho hiện tại.
     */
    public function index()
    {
        $stocks = Product::with(['category', 'brand'])
            ->select(
                'product_id',
                'name',
                'image',
                'stock',
                'price',
                'updated_at',
                'category_id',
                'brand_id'
            )
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($product) {
                $minStock = max(5, (int)($product->price / 1000000));

                if ($product->stock == 0) {
                    $status = 'Hết hàng';
                    $statusColor = 'red';
                } elseif ($product->stock <= $minStock) {
                    $status = 'Sắp hết';
                    $statusColor = 'yellow';
                } else {
                    $status = 'Còn hàng';
                    $statusColor = 'green';
                }

                return [
                    'id' => $product->product_id,
                    'hashed_id' => $product->hashed_id,
                    'name' => $product->name,
                    'image' => $product->image,
                    'brand' => optional($product->brand)->name,
                    'category' => optional($product->category)->name,
                    'current_stock' => $product->stock,
                    'min_stock' => $minStock,
                    'status' => $status,
                    'status_color' => $statusColor,
                    'last_updated' => optional($product->updated_at)?->format('d/m/Y'),
                ];
            });

        return response()->json($stocks);
    }

    /**
     * Lịch sử nhập / xuất kho.
     */
    public function history()
    {
        $history = StockTransaction::with([
                'product:product_id,name,image',
                'user:user_id,username,email',
                'user.profile:profile_id,user_id,full_name',
            ])
            ->orderByDesc('created_at')
            ->limit(200)
            ->get()
            ->map(function (StockTransaction $tx) {
                return [
                    'id' => $tx->stock_transaction_id,
                    'product_id' => $tx->product_id,
                    'product_name' => optional($tx->product)->name,
                    'product_hashed_id' => optional($tx->product)->hashed_id,
                    'product_image' => optional($tx->product)->image,
                    'type' => $tx->type,
                    'quantity' => $tx->quantity,
                    'date' => optional($tx->created_at)?->format('Y-m-d'),
                    'note' => $tx->note,
                    'user' => $tx->user ? (
                        $tx->user->profile->full_name
                        ?? $tx->user->username
                        ?? $tx->user->email
                    ) : 'System',
                ];
            });

        return response()->json($history->values());
    }

    /**
     * Cập nhật tồn kho (nhập hoặc xuất).
     */
    public function updateStock(Request $request)
    {
        $request->validate([
            'product_id' => 'required',
            'type' => 'required|in:import,export',
            'quantity' => 'required|integer|min:1',
            'note' => 'nullable|string|max:500',
        ]);

        $productId = $request->product_id;

        // Tìm product theo ID hoặc hashed_id
        if (is_numeric($productId)) {
            $product = Product::where('product_id', $productId)->firstOrFail();
        } else {
            $product = Product::findByHashedId($productId);
            if (!$product) {
                return response()->json([
                    'message' => 'Không tìm thấy sản phẩm',
                ], 404);
            }
        }

        DB::beginTransaction();
        try {
            if ($request->type === 'import') {
                $product->stock += $request->quantity;
            } else {
                if ($product->stock < $request->quantity) {
                    return response()->json([
                        'message' => 'Số lượng tồn kho không đủ để xuất',
                    ], 400);
                }
                $product->stock -= $request->quantity;
            }

            $product->save();

            // Ghi lịch sử
            StockTransaction::create([
                'product_id' => $product->product_id,
                'user_id' => $request->user()->user_id ?? null,
                'type' => $request->type,
                'quantity' => $request->quantity,
                'note' => $request->note,
                'created_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => $request->type === 'import' ? 'Nhập kho thành công' : 'Xuất kho thành công',
                'product' => $product,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Đã xảy ra lỗi: ' . $e->getMessage(),
            ], 500);
        }
    }
}
