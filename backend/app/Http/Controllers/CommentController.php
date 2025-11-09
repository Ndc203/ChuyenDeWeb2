<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Exports\CommentsExport;

class CommentController extends Controller
{
    // Lấy danh sách tất cả bình luận
    public function index()
    {
        $comments = Comment::with(['user', 'post'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($comment) {
                return [
                    'id' => $comment->comment_id,
                    'user_name' => $comment->user->username ?? 'Ẩn danh',
                    'post_title' => $comment->post->title ?? 'Không xác định',
                    'content' => $comment->content,
                    'created_at' => $comment->created_at,
                ];
            });

        return response()->json($comments);
    }

    // Lấy chi tiết 1 bình luận
    public function show($id)
    {
        $comment = Comment::with(['user', 'post'])->find($id);
        if (!$comment) {
            return response()->json(['message' => 'Không tìm thấy bình luận.'], 404);
        }

        return response()->json([
            'id' => $comment->comment_id,
            'user_name' => $comment->user->username ?? 'Ẩn danh',
            'post_title' => $comment->post->title ?? 'Không xác định',
            'content' => $comment->content,
            'created_at' => $comment->created_at,
        ]);
    }

    // Thêm bình luận mới
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'post_id' => 'required|exists:posts,post_id',
            'user_id' => 'nullable|exists:users,user_id',
            'content' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $comment = Comment::create($validator->validated());

        return response()->json([
            'message' => 'Thêm bình luận thành công!',
            'data' => $comment,
        ], 201);
    }

    // Cập nhật nội dung bình luận
    public function update(Request $request, $id)
    {
        $comment = Comment::find($id);
        if (!$comment) {
            return response()->json(['message' => 'Không tìm thấy bình luận.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $comment->update(['content' => $request->content]);

        return response()->json([
            'message' => 'Cập nhật bình luận thành công!',
            'data' => $comment
        ]);
    }

    // Xoá bình luận
    public function destroy($id)
    {
        $comment = Comment::find($id);
        if (!$comment) {
            return response()->json(['message' => 'Không tìm thấy bình luận.'], 404);
        }

        $comment->delete();
        return response()->json(['message' => 'Xoá bình luận thành công!']);
    }

    // Xuất dữ liệu
    public function export(Request $request)
    {
        $format = $request->query('format', 'excel');
        $comments = Comment::with(['user', 'post'])
            ->get(['comment_id', 'post_id', 'user_id', 'content', 'created_at']);

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('comments_pdf', [
                'comments' => $comments
            ]);
            return $pdf->download('comments.pdf');
        }

        return Excel::download(new CommentsExport, 'comments.xlsx');
    }
}
