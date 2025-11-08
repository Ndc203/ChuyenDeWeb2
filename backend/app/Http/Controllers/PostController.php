<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostVersion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PostController extends Controller
{
    public function __construct()
    {
        // Chỉ các route này không cần auth
        $this->middleware('auth:sanctum')->except(['index', 'show', 'statistics']);
    }

    // 🧩 Lấy danh sách tất cả bài viết
    public function index()
    {
        return Post::with(['category', 'user'])
            ->orderByDesc('created_at')
            ->get();
    }

    // 🧩 Tạo bài viết mới
   public function store(Request $request)
{
    $user = auth()->user();

    $validated = $request->validate([
        'category_id' => 'nullable|exists:postcategories,id',
        'title' => 'required|string|max:255',
        'excerpt' => 'nullable|string',
        'content' => 'nullable|string',
        'status' => 'in:draft,published',
        'is_trending' => 'boolean',
        'image' => 'nullable|image|max:2048',
    ]);

    $imagePath = null;
    if ($request->hasFile('image')) {
        $file = $request->file('image');
        $filename = time() . '_' . $file->getClientOriginalName();
        $file->move(public_path('images/posts'), $filename);
        $imagePath =  $filename;
    }

    $post = Post::create([
        'user_id' => $user->user_id,
        'category_id' => $validated['category_id'] ?? null,
        'title' => $validated['title'],
        'excerpt' => $validated['excerpt'] ?? '',
        'content' => $validated['content'] ?? '',
        'status' => $validated['status'] ?? 'draft',
        'is_trending' => $request->boolean('is_trending', false),
        'image' => $imagePath,
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Bài viết đã được tạo thành công!',
        'data' => $post,
    ], 201);
}

    // 🧩 Xem chi tiết bài viết
    public function show($id)
    {
        $post = Post::with(['category', 'user'])->findOrFail($id);
        return response()->json($post);
    }

    // 🧩 Cập nhật bài viết
    public function update(Request $request, $id)
{
    $post = Post::findOrFail($id);
    $user = auth()->user();

    // Kiểm tra quyền
    if ($user->role !== 'admin' && $post->user_id !== $user->user_id) {
        return response()->json([
            'success' => false,
            'message' => 'Bạn không có quyền chỉnh sửa bài viết này!',
        ], 403);
    }

    $validated = $request->validate([
        'category_id' => 'nullable|exists:postcategories,id',
        'title' => 'nullable|string|max:255',
        'excerpt' => 'nullable|string',
        'content' => 'nullable|string',
        'status' => 'nullable|in:draft,published',
        'is_trending' => 'nullable|boolean',
        'image' => 'nullable|image|max:2048',
    ]);

    // Lưu phiên bản cũ
    PostVersion::create([
        'post_id' => $post->id,
        'user_id' => $user->user_id,
        'category_id' => $post->category_id,
        'title' => $post->title,
        'excerpt' => $post->excerpt,
        'content' => $post->content,
        'image' => $post->image,
        'status' => $post->status,
        'is_trending' => $post->is_trending,
    ]);

    $post->fill($validated);

    if ($request->hasFile('image')) {
        // Xóa ảnh cũ nếu có
        if ($post->image && file_exists(public_path($post->image))) {
            unlink(public_path($post->image));
        }
        $file = $request->file('image');
        $filename = time() . '_' . $file->getClientOriginalName();
        $file->move(public_path('images/posts'), $filename);
        $post->image = $filename;
    }

    $post->save();

    return response()->json([
        'success' => true,
        'message' => 'Cập nhật bài viết thành công',
        'data' => $post,
    ]);
}


    // 🧩 Xóa bài viết
    public function destroy($id)
{
    $post = Post::findOrFail($id);
    $user = auth()->user();

    if ($user->role !== 'admin' && $post->user_id !== $user->user_id) {
        return response()->json([
            'success' => false,
            'message' => 'Bạn không có quyền xóa bài viết này!',
        ], 403);
    }

    if ($post->image && file_exists(public_path($post->image))) {
        unlink(public_path($post->image));
    }

    $post->delete();

    return response()->json([
        'success' => true,
        'message' => 'Đã xóa bài viết thành công',
    ]);
}

    // 🧩 Thống kê bài viết
    public function statistics()
    {
        $postsByStatus = [
            ['name' => 'Nháp', 'value' => Post::where('status', 'draft')->count()],
            ['name' => 'Đã xuất bản', 'value' => Post::where('status', 'published')->count()],
        ];

        $postsByCategory = DB::table('postcategories')
            ->leftJoin('posts', 'posts.category_id', '=', 'postcategories.id')
            ->select('postcategories.name as category', DB::raw('count(posts.id) as count'))
            ->groupBy('postcategories.name')
            ->get();

        return response()->json([
            'total_posts' => Post::count(),
            'trending_posts' => Post::where('is_trending', true)->count(),
            'posts_by_status' => $postsByStatus,
            'posts_by_category' => $postsByCategory,
        ]);
    }

    // 🧩 Danh sách phiên bản
    public function versions($postId)
    {
        $versions = PostVersion::where('post_id', $postId)
            ->with('user:user_id,username')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($versions);
    }

    // 🧩 Xem chi tiết phiên bản
    public function showVersion($postId, $versionId)
    {
        $version = PostVersion::where('post_id', $postId)
            ->where('id', $versionId)
            ->with('user:user_id,username')
            ->firstOrFail();

        return response()->json($version);
    }

    // 🧩 Khôi phục bài viết từ phiên bản cũ
    public function restoreVersion($postId, $versionId)
    {
        $post = Post::findOrFail($postId);
        $version = PostVersion::where('post_id', $postId)->findOrFail($versionId);
        $user = auth()->user();

        if ($user->role !== 'admin' && $post->user_id !== $user->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Bạn không có quyền khôi phục bài viết này!',
            ], 403);
        }

        // Lưu phiên bản hiện tại trước khi restore
        PostVersion::create([
            'post_id' => $post->id,
            'user_id' => $user->user_id,
            'category_id' => $post->category_id,
            'title' => $post->title,
            'excerpt' => $post->excerpt,
            'content' => $post->content,
            'image' => $post->image,
            'status' => $post->status,
            'is_trending' => $post->is_trending,
        ]);

        // Khôi phục dữ liệu
        $post->update([
            'title' => $version->title,
            'excerpt' => $version->excerpt,
            'content' => $version->content,
            'image' => $version->image,
            'status' => $version->status,
            'is_trending' => $version->is_trending,
            'category_id' => $version->category_id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đã khôi phục bài viết về phiên bản trước đó',
            'data' => $post
        ]);
    }
}
