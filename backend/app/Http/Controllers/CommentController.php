<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CommentController extends Controller
{
    public function __construct()
    {
        // Các route không yêu cầu đăng nhập
        $this->middleware('auth:sanctum')->except(['index', 'show', 'getCommentsByPost']);
    }

    // 🧩 Lấy danh sách tất cả bình luận
    public function index(Request $request)
    {
        $query = Comment::with('user', 'post')->orderByDesc('created_at');

        if ($request->has('post_id')) {
            $query->where('post_id', $request->post_id);
        }

        return response()->json($query->get()->map(function ($comment) {
            return [
                'id' => $comment->comment_id,
                'user_name' => $comment->user->username ?? 'Ẩn danh',
                'content' => html_entity_decode($comment->content),
                'created_at' => $comment->created_at,
            ];
        }));
    }

    // 🧩 Lấy comment theo post
    public function getCommentsByPost($postId)
    {
        $comments = Comment::with('user')
            ->where('post_id', $postId)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->comment_id,
                    'user_name' => $comment->user->username ?? 'Ẩn danh',
                    'content' => html_entity_decode($comment->content),
                    'created_at' => $comment->created_at,
                ];
            });

        return response()->json($comments);
    }

    // 🧩 Xem chi tiết 1 comment
    public function show($id)
    {
        $comment = Comment::with(['user', 'post'])->findOrFail($id);

        return response()->json([
            'id' => $comment->comment_id,
            'user_name' => $comment->user->username ?? 'Ẩn danh',
            'post_title' => $comment->post->title ?? 'Không xác định',
            'content' => $comment->content,
            'created_at' => $comment->created_at,
        ]);
    }

    // 🧩 Thêm bình luận mới (chỉ user login)
    // Thêm bình luận mới
public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'post_id' => 'required|exists:posts,post_id',
        'content' => 'required|string|max:2000',
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $user = auth()->user();
    if (!$user) {
        return response()->json(['message' => 'Bạn cần đăng nhập để bình luận.'], 403);
    }

    try {
        $validated = $validator->validated();

        // Nếu nội dung chỉ là text, bọc <p>
        $content = $validated['content'];
        if (!str_starts_with(trim($content), '<')) {
            $content = '<p>' . e($content) . '</p>';
        }

        $comment = Comment::create([
            'post_id' => $validated['post_id'],
            'user_id' => $user->user_id,
            'content' => $content,
        ]);

        return response()->json([
            'message' => 'Thêm bình luận thành công!',
            'data' => [
                'id' => $comment->comment_id,
                'user_name' => $user->username,
                'content' => $comment->content,
                'created_at' => $comment->created_at,
            ]
        ], 201);

    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Thêm bình luận thất bại.',
            'error' => $e->getMessage(),
        ], 500);
    }
}


    // 🧩 Cập nhật bình luận
    public function update(Request $request, $id)
    {
        $comment = Comment::findOrFail($id);
        $user = auth()->user();

        // Chỉ admin hoặc người tạo comment mới được sửa
        if ($user->role !== 'admin' && $comment->user_id !== $user->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền chỉnh sửa bình luận này!',
            ], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $comment->update(['content' => $validated['content']]);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật bình luận thành công!',
            'data' => $comment
        ]);
    }

    // 🧩 Xoá bình luận
    public function destroy($id)
    {
        $comment = Comment::findOrFail($id);
        $user = auth()->user();

        if ($user->role !== 'admin' && $comment->user_id !== $user->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền xóa bình luận này!',
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa bình luận!'
        ]);
    }
}
