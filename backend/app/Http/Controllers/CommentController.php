<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Purifier;

class CommentController extends Controller
{
    protected function jsonError($message, $status = 400)
{
    return response()->json(['success' => false, 'message' => $message], $status);
}


    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show', 'getCommentsByPost']);
    }

    // Lấy tất cả comment
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

    // Thêm comment mới
    
 public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'post_id'   => 'required|exists:posts,post_id',
        'content'   => 'required|string|max:5000',
        'parent_id' => 'nullable|exists:comments,comment_id',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'errors'  => $validator->errors()
        ], 422);
    }

    $user = auth()->user();
    if (!$user) return $this->jsonError("Bạn cần đăng nhập.", 403);

    $cleanContent = Purifier::clean($request->content);

    $comment = Comment::create([
        'post_id'   => $request->post_id,
        'user_id'   => $user->user_id,
        'parent_id' => $request->parent_id,
        'content'   => $cleanContent,
    ]);

    return response()->json([
        'success' => true,
        'message' => "Thêm bình luận thành công!",
        'data' => [
            'id'         => $comment->comment_id,
            'post_id'    => $comment->post_id,
            'user_id'    => $comment->user_id,
            'parent_id'  => $comment->parent_id,
            'user_name'  => $user->username,
            'user_email' => $user->email,
            'content'    => $comment->content,
            'created_at' => $comment->created_at,
        ]
    ], 201);
}



    // Cập nhật comment
    public function update(Request $request, $id)
{
    $comment = Comment::find($id);
    if (!$comment) return $this->jsonError("Comment không tồn tại.", 404);

    $user = auth()->user();
    if (!$user) return $this->jsonError("Bạn cần đăng nhập.", 403);
    if ($user->role !== "admin" && $comment->user_id !== $user->user_id)
        return $this->jsonError("Bạn không có quyền sửa bình luận này.", 403);

    $validator = Validator::make($request->all(), [
        'content' => 'required|string|max:5000'
    ]);

    if ($validator->fails()) {
        return response()->json([
            'success' => false,
            'errors'  => $validator->errors()
        ], 422);
    }

    $cleanContent = Purifier::clean($request->content);

    $comment->content = $cleanContent;
    $comment->save();

    return response()->json([
        'success' => true,
        'message' => "Cập nhật bình luận thành công!",
        'data' => [
            'id'         => $comment->comment_id,
            'content'    => $comment->content,
            'user_id'    => $comment->user->user_id,
            'user_name'  => $comment->user->username,
            'user_email' => $comment->user->email,
            'parent_id'  => $comment->parent_id,
            'created_at' => $comment->created_at,
        ]
    ]);
}

    // Xoá comment
    public function destroy($id)
{
    $comment = Comment::find($id);
    if (!$comment) return $this->jsonError("Comment không tồn tại.", 404);

    $user = auth()->user();
    if (!$user) return $this->jsonError("Bạn cần đăng nhập.", 403);

    if ($user->role !== "admin" && $comment->user_id !== $user->user_id)
        return $this->jsonError("Bạn không có quyền xóa bình luận này.", 403);

    $comment->delete();

    return response()->json([
        'success' => true,
        'message' => "Đã xóa bình luận!"
    ]);
}

}