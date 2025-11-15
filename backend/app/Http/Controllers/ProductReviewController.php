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

        // Tìm kiếm
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('product', function($pq) use ($search) {
                    $pq->where('product_name', 'like', "%{$search}%");
                })
                ->orWhereHas('user', function($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%");
                })
                ->orWhere('comment', 'like', "%{$search}%");
            });
        }

        // Lọc theo trạng thái
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
