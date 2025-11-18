<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Purifier;

class CommentController extends Controller
{
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
        return $this->index(new Request(['post_id' => $postId]));
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
            'post_id' => 'required|exists:posts,post_id',
            'content' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Bạn cần đăng nhập để bình luận.'], 403);
        }

        try {
            $data = $validator->validated();

            // Lọc HTML, giữ nguyên các thẻ hợp lệ
            $cleanContent = Purifier::clean($data['content'], [
                'HTML.Allowed' => 'p,b,strong,i,em,u,a[href|title],ul,ol,li,img[src|alt|title|width|height]',
                'AutoFormat.RemoveEmpty' => true,
            ]);

            $comment = Comment::create([
                'post_id' => $data['post_id'],
                'user_id' => $user->user_id,
                'content' => $cleanContent,
            ]);

            return response()->json([
                'message' => 'Thêm bình luận thành công!',
                'data' => [
                    'id' => $comment->comment_id,
                    'user_name' => $user->username,
                    'user_email' => $user->email,
                    'user_id' => $user->user_id,
                    'content' => $comment->content, // HTML sạch
                    'created_at' => $comment->created_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi khi thêm comment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Cập nhật comment
    public function update(Request $request, $id)
    {
        $comment = Comment::findOrFail($id);
        $user = auth()->user();

        if (!$user) return response()->json(['message' => 'Bạn cần đăng nhập.'], 403);
        if ($comment->user_id !== $user->user_id && $user->role !== 'admin') {
            return response()->json(['message' => 'Bạn không có quyền sửa bình luận này.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $cleanContent = Purifier::clean($validator->validated()['content'], [
                'HTML.Allowed' => 'p,b,strong,i,em,u,a[href|title],ul,ol,li,img[src|alt|title|width|height]',
                'AutoFormat.RemoveEmpty' => true,
            ]);

            $comment->content = $cleanContent;
            $comment->save();

            return response()->json([
                'message' => 'Cập nhật bình luận thành công.',
                'data' => [
                    'id' => $comment->comment_id,
                    'user_name' => $comment->user->username ?? 'Ẩn danh',
                    'user_email' => $comment->user->email ?? 'default@example.com',
                    'user_id' => $comment->user_id,
                    'content' => $comment->content, // HTML sạch
                    'created_at' => $comment->created_at,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi khi cập nhật comment',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    // Xoá comment
    public function destroy($id)
    {
        $comment = Comment::findOrFail($id);
        $user = auth()->user();

        if (!$user) return response()->json(['message' => 'Bạn cần đăng nhập.'], 403);

        if ($user->role !== 'admin' && $comment->user_id !== $user->user_id) {
            return response()->json(['success' => false, 'message' => 'Bạn không có quyền xóa bình luận này!'], 403);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa bình luận!'
        ]);
    }
}
