<?php

namespace App\Http\Controllers;

use App\Models\ProductReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductReviewController extends Controller
{
    /**
     * Lấy danh sách đánh giá với bộ lọc
     */
    public function index(Request $request)
    {
        $query = ProductReview::with(['product', 'user'])
            ->orderBy('created_at', 'desc');

        // Lọc theo product_id (dùng cho shop khi hiển thị review của 1 sản phẩm)
        if ($request->has('product_id') && $request->product_id) {
            $query->where('product_id', $request->product_id);
        }

        // Kiểm tra xem có phải request từ shop/public không
        // Nếu không phải admin, chỉ hiển thị review đã approved
        $user = auth('sanctum')->user();
        $isAdmin = $user && $user->role === 'admin';
        
        if (!$isAdmin && !$request->has('admin')) {
            // Người dùng thường hoặc guest: chỉ xem approved reviews
            $query->where('status', 'approved');
        }

        // Tìm kiếm (chỉ dành cho admin)
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('product', function($pq) use ($search) {
                    $pq->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('user', function($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%");
                })
                ->orWhere('comment', 'like', "%{$search}%");
            });
        }

        // Lọc theo trạng thái (chỉ dành cho admin)
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Lọc theo rating
        if ($request->has('rating') && $request->rating !== 'all') {
            $query->where('rating', $request->rating);
        }

        $reviews = $query->paginate($request->get('per_page', 10));

        return response()->json($reviews);
    }

    /**
     * Tạo đánh giá mới (từ khách hàng)
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,product_id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|min:10|max:1000',
        ]);

        // Lấy user_id từ token đăng nhập
        $userId = auth('sanctum')->id();
        
        if (!$userId) {
            return response()->json([
                'message' => 'Vui lòng đăng nhập để đánh giá'
            ], 401);
        }

        // Kiểm tra xem user đã đánh giá sản phẩm này chưa
        $existingReview = ProductReview::where('product_id', $request->product_id)
            ->where('user_id', $userId)
            ->first();

        if ($existingReview) {
            return response()->json([
                'message' => 'Bạn đã đánh giá sản phẩm này rồi'
            ], 422);
        }

        // Tạo đánh giá mới
        $review = ProductReview::create([
            'product_id' => $request->product_id,
            'user_id' => $userId,
            'rating' => $request->rating,
            'comment' => $request->comment,
            'status' => 'pending', // Mặc định chờ duyệt
            'helpful_count' => 0,
        ]);

        // Load relationships để trả về
        $review->load(['product', 'user']);

        return response()->json([
            'message' => 'Đánh giá của bạn đã được gửi và đang chờ duyệt',
            'review' => $review
        ], 201);
    }

    /**
     * Lấy chi tiết đánh giá
     */
    public function show($id)
    {
        $review = ProductReview::with(['product', 'user'])->findOrFail($id);
        return response()->json($review);
    }

    /**
     * Cập nhật trạng thái đánh giá
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,approved,rejected'
        ]);

        $review = ProductReview::findOrFail($id);
        $review->status = $request->status;
        $review->save();

        return response()->json([
            'message' => 'Cập nhật trạng thái thành công',
            'review' => $review
        ]);
    }

    /**
     * Xóa đánh giá
     */
    public function destroy($id)
    {
        $review = ProductReview::findOrFail($id);
        $review->delete();

        return response()->json([
            'message' => 'Xóa đánh giá thành công'
        ]);
    }

    /**
     * Cập nhật số lượng helpful
     */
    public function updateHelpful(Request $request, $id)
    {
        $review = ProductReview::findOrFail($id);
        $review->helpful_count = $review->helpful_count + 1;
        $review->save();

        return response()->json([
            'message' => 'Cập nhật thành công',
            'review' => $review
        ]);
    }

    /**
     * Thống kê đánh giá
     */
    public function statistics()
    {
        $total = ProductReview::count();
        $approved = ProductReview::where('status', 'approved')->count();
        $pending = ProductReview::where('status', 'pending')->count();
        $rejected = ProductReview::where('status', 'rejected')->count();
        
        $avgRating = ProductReview::avg('rating');
        
        $ratingDistribution = ProductReview::select('rating', DB::raw('count(*) as count'))
            ->groupBy('rating')
            ->orderBy('rating', 'desc')
            ->get();

        return response()->json([
            'total' => $total,
            'approved' => $approved,
            'pending' => $pending,
            'rejected' => $rejected,
            'average_rating' => round($avgRating, 2),
            'rating_distribution' => $ratingDistribution
        ]);
    }
}
