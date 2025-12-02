<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Comment;
use PDF;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\CommentsExport;
use Illuminate\Support\Facades\Validator;
use Purifier;

class CommentController extends Controller
{
    public function export(Request $request)
    {
        $format = $request->query('format', 'excel'); // excel | pdf
        $comments = Comment::with(['post', 'user'])
            ->orderByDesc('comment_id')
            ->get();

        if ($format === 'pdf') {
            $pdf = PDF::loadView('comments_pdf', compact('comments'))
                      ->setPaper('a4', 'portrait');

            return $pdf->download('comments.pdf');
        }

        if ($format === 'excel') {
            return Excel::download(new CommentsExport, 'comments.xlsx');
        }

        return response()->json(['error' => 'Invalid format'], 400);
    }
    protected function jsonError($message, $status = 400)
    {
        return response()->json(['success' => false, 'message' => $message], $status);
    }

    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show', 'getCommentsByPost','export']);
    }

    // ============================================================
    // VALIDATION CHUNG
    // ============================================================
    private function cleanText($text)
    {
        // Remove full-width spaces
        $text = preg_replace('/　+/', '', $text);

        // Trim normal spaces
        $text = trim($text);

        return $text;
    }

    // ============================================================
    // CREATE COMMENT
    // ============================================================
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'post_id' => 'required|integer|exists:posts,post_id',
            'content' => 'required|string|max:5000',
            'parent_id' => 'nullable|integer|exists:comments,comment_id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = auth()->user();
        if (!$user)
            return $this->jsonError("Bạn cần đăng nhập.", 403);

        // Clean text
        $content = $this->cleanText($request->content);
        if ($content === "")
            return $this->jsonError("Nội dung không được để trống.", 422);

        // Sanitize HTML
        $cleanContent = Purifier::clean($content);

        // 🛡 Anti-duplicate — ngăn spam bấm nút lưu liên tục
        $exists = Comment::where('user_id', $user->user_id)
            ->where('post_id', $request->post_id)
            ->where('content', $cleanContent)
            ->where('created_at', '>', now()->subSeconds(3))
            ->exists();

        if ($exists)
            return $this->jsonError("Bạn đang gửi bình luận quá nhanh. Vui lòng thử lại.", 429);

        $comment = Comment::create([
            'post_id' => $request->post_id,
            'user_id' => $user->user_id,
            'parent_id' => $request->parent_id,
            'content' => $cleanContent,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Thêm bình luận thành công!",
            'data' => [
                'id' => $comment->comment_id,
                'content' => $comment->content,
                'created_at' => $comment->created_at,
            ]
        ], 201);
    }

    // ============================================================
    // UPDATE COMMENT — thêm optimistic locking
    // ============================================================
    public function update(Request $request, $id)
    {
        if (!is_numeric($id))
            return $this->jsonError("Không tìm thấy trang.", 404);

        $comment = Comment::find($id);
        if (!$comment)
            return $this->jsonError("Comment không tồn tại.", 404);

        $user = auth()->user();
        if (!$user)
            return $this->jsonError("Bạn cần đăng nhập.", 403);

        if ($user->role !== "admin" && $comment->user_id !== $user->user_id)
            return $this->jsonError("Bạn không có quyền sửa bình luận.", 403);

        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:5000',
            'updated_at' => 'required' // 🔥 optimistic locking
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Kiểm tra race condition (nếu tab khác đã sửa)
        if ($request->updated_at !== $comment->updated_at->toISOString()) {
            return $this->jsonError("Dữ liệu đã thay đổi. Vui lòng tải lại trang trước khi cập nhật.", 409);
        }

        $content = $this->cleanText($request->content);
        if ($content === "")
            return $this->jsonError("Nội dung không được để trống.", 422);

        $comment->content = Purifier::clean($content);
        $comment->save();

        return response()->json([
            'success' => true,
            'message' => "Cập nhật bình luận thành công!",
            'data' => [
                'id' => $comment->comment_id,
                'content' => $comment->content,
                'updated_at' => $comment->updated_at
            ]
        ]);
    }

    // ============================================================
    // DELETE COMMENT — ngăn delete từ tab khác
    // ============================================================
    public function destroy($id)
    {
        if (!is_numeric($id))
            return $this->jsonError("Không tìm thấy trang.", 404);

        $comment = Comment::find($id);
        if (!$comment)
            return $this->jsonError("Comment không tồn tại.", 404);

        $user = auth()->user();
        if (!$user)
            return $this->jsonError("Bạn cần đăng nhập.", 403);

        if ($user->role !== "admin" && $comment->user_id !== $user->user_id)
            return $this->jsonError("Bạn không có quyền xóa bình luận.", 403);

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => "Đã xóa bình luận!"
        ]);
    }

    public function index(Request $request)
    {
        $query = Comment::with('user', 'post')->orderByDesc('created_at');

        if ($request->has('post_id')) {
            $query->where('post_id', $request->post_id);
        }

        $comments = $query->get()->map(function ($comment) {
            return [
                'id' => $comment->comment_id,
                'user_name' => $comment->user->username ?? 'Ẩn danh',
                'user_email' => $comment->user->email ?? 'default@example.com',
                'user_id' => $comment->user_id,
                'content' => $comment->content, // raw HTML
                'created_at' => $comment->created_at,
            ];
        });

        return response()->json($comments);
    }

    // Lấy comment theo post
    public function getCommentsByPost($postId)
{
    $comments = Comment::with('user')
        ->where('post_id', $postId)
        ->orderBy('created_at', 'asc')
        ->get()
        ->map(function ($comment) {
            return [
                'id'         => $comment->comment_id,
                'post_id'    => $comment->post_id,
                'user_id'    => $comment->user_id,
                'user_name'  => $comment->user->username ?? 'Ẩn danh',
                'user_email' => $comment->user->email ?? 'default@example.com',
                'content'    => $comment->content,
                'parent_id'  => $comment->parent_id,
                'created_at' => $comment->created_at,
            ];
        });

    return response()->json($comments);
}

    // Xem chi tiết 1 comment
    public function show($id)
    {
        $comment = Comment::with(['user', 'post'])->findOrFail($id);

        return response()->json([
            'id' => $comment->comment_id,
            'user_name' => $comment->user->username ?? 'Ẩn danh',
            'user_email' => $comment->user->email ?? 'default@example.com',
            'user_id' => $comment->user_id,
            'post_title' => $comment->post->title ?? 'Không xác định',
            'content' => $comment->content, // raw HTML
            'created_at' => $comment->created_at,
        ]);
    }
    
}
