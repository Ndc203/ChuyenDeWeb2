<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostVersion;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
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
        $validated = $request->validate([
            'category_id' => 'nullable|exists:postcategories,post_category_id',
            'title' => 'required|string|max:255',
            'excerpt' => 'nullable|string',
            'content' => 'nullable|string',
            'status' => 'in:draft,published',
            'is_trending' => 'boolean',
            'image' => 'nullable|image|max:2048',
        ]);

        $imageName = null;
        if ($request->hasFile('image')) {
            $imageName = time() . '_' . Str::random(8) . '.' .
                $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move(public_path('images/posts'), $imageName);
        }

        $post = Post::create([
            'user_id' => auth()->id() ?? 1,
            'post_category_id' => $validated['category_id'] ?? null,
            'title' => $validated['title'],
            'excerpt' => $validated['excerpt'] ?? '',
            'content' => $validated['content'] ?? '',
            'status' => $validated['status'] ?? 'draft',
            'is_trending' => $validated['is_trending'] ?? false,
            'image' => $imageName,
        ]);

        return response()->json([
            'message' => 'Bài viết đã được tạo thành công!',
            'data' => $post,
        ]);
    }

    // 🧩 Xem chi tiết bài viết
    public function show($post_id)
    {
        $post = Post::with(['category', 'user'])->findOrFail($post_id);
        return response()->json($post);
    }

    // 🧩 Cập nhật bài viết + lưu phiên bản cũ
    public function update(Request $request, $post_id)
    {
        $post = Post::findOrFail($post_id);

        PostVersion::create([
            'post_id' => $post->post_id,
            'user_id' => auth()->id(),
            'post_category_id' => $post->post_category_id,
            'title' => $post->title,
            'excerpt' => $post->excerpt,
            'content' => $post->content,
            'image' => $post->image,
            'status' => $post->status,
            'is_trending' => $post->is_trending,
        ]);

        $post->fill($request->only([
            'title', 'excerpt', 'content', 'status', 'category_id', 'is_trending'
        ]));

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $filename = time() . '_' . $image->getClientOriginalName();
            $image->move(public_path('images/posts'), $filename);
            $post->image = $filename;
        }

        $post->save();

        return response()->json([
            'message' => 'Cập nhật bài viết thành công',
            'post' => $post,
        ]);
    }

    // 🧩 Xóa bài viết
    public function destroy($post_id)
    {
        $post = Post::findOrFail($post_id);
        if ($post->image && file_exists(public_path('images/posts/' . $post->image))) {
            unlink(public_path('images/posts/' . $post->image));
        }
        $post->delete();

        return response()->json(['message' => 'Đã xóa bài viết']);
    }

    // 🧩 Thống kê bài viết
    public function statistics()
    {
        $postsByStatus = [
            ['name' => 'Nháp', 'value' => Post::where('status', 'draft')->count()],
            ['name' => 'Đã xuất bản', 'value' => Post::where('status', 'published')->count()],
        ];

        $postsByCategory = DB::table('posts')
            ->join('postcategories', 'posts.post_category_id', '=', 'postcategories.post_category_id')
            ->select('postcategories.name as category', DB::raw('count(posts.post_id) as count'))
            ->groupBy('postcategories.name')
            ->get();

        $totalPosts = Post::count();
        $trendingPosts = Post::where('is_trending', true)->count();
        $newPostsThisMonth = Post::whereMonth('created_at', now()->month)->count();

        return response()->json([
            'total_posts' => $totalPosts,
            'trending_posts' => $trendingPosts,
            'new_posts_this_month' => $newPostsThisMonth,
            'posts_by_status' => $postsByStatus,
            'posts_by_category' => $postsByCategory,
        ]);
    }

    // 🧩 Danh sách phiên bản
    public function versions($post_id)
    {
        $versions = PostVersion::where('post_id', $post_id)
            ->with('user:user_id,name')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($versions);
    }

    // 🧩 Xem chi tiết một phiên bản
    public function showVersion($post_id, $version_id)
    {
        $version = PostVersion::where('post_id', $post_id)
            ->where('post_version_id', $version_id)
            ->with('user:user_id,name')
            ->firstOrFail();

        return response()->json($version);
    }

    // 🧩 Khôi phục về phiên bản cũ
    public function restoreVersion($post_id, $version_id)
    {
        $version = PostVersion::where('post_id', $post_id)->findOrFail($version_id);
        $post = Post::findOrFail($post_id);

        $post->update([
            'title' => $version->title,
            'excerpt' => $version->excerpt,
            'content' => $version->content,
            'image' => $version->image,
            'status' => $version->status,
            'is_trending' => $version->is_trending,
            'post_category_id' => $version->post_category_id,
        ]);

        return response()->json([
            'message' => 'Đã khôi phục bài viết về phiên bản trước đó',
            'post' => $post
        ]);
    }
}
