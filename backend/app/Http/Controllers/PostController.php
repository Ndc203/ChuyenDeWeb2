<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostVersion;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PostController extends Controller
{
    public function __construct()
{
    $this->middleware('auth:sanctum')->except([
        'index', 
        'show', 
        'statistics', 
        'versions',       
        'showVersion'     
    ]);
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
            'post_category_id' => 'nullable|exists:postcategories,post_category_id',
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
            $imagePath = $filename;
        }

        $post = Post::create([
            'user_id' => $user->user_id,
            'post_category_id' => $validated['post_category_id'] ?? null,
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
            'post_category_id' => 'nullable|exists:postcategories,post_category_id',
            'title' => 'nullable|string|max:255',
            'excerpt' => 'nullable|string',
            'content' => 'nullable|string',
            'status' => 'nullable|in:draft,published',
            'is_trending' => 'nullable|boolean',
            'image' => 'nullable|image|max:2048',
        ]);

        // Lưu phiên bản cũ
        PostVersion::create([
            'post_id' => $post->post_id,
            'user_id' => $user->user_id,
            'post_category_id' => $post->post_category_id,
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

       if ($post->image && file_exists(public_path('images/posts/' . $post->image))) {
    unlink(public_path('images/posts/' . $post->image));
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
    ->leftJoin('posts', 'posts.post_category_id', '=', 'postcategories.post_category_id')
    ->select('postcategories.name as category', DB::raw('count(posts.post_id) as count')) // sửa posts.id -> posts.post_id
    ->groupBy('postcategories.name')
    ->get();


        return response()->json([
            'total_posts' => Post::count(),
            'trending_posts' => Post::where('is_trending', true)->count(),
            'posts_by_status' => $postsByStatus,
            'posts_by_category' => $postsByCategory,
        ]);
    }

    // 🧩 Danh sách phiên bản (public)
public function versions($id)
    {
        // Tìm post
        $post = Post::with('versions')->find($id);

        if (!$post) {
            return response()->json([
                'message' => 'Post not found.'
            ], 404);
        }

        return response()->json([
            'post_id' => $post->post_id,
            'title' => $post->title,
            'versions' => $post->versions, // Giả sử quan hệ versions đã có
        ]);
    }


    // 🧩 Xem chi tiết phiên bản (public)
    public function showVersion($postId, $versionId)
    {
        try {
            $version = PostVersion::where('post_id', $postId)
                ->where('post_version_id', $versionId)
                ->with('user:user_id,username')
                ->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => $version
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Phiên bản không tồn tại!'
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi server: '.$e->getMessage()
            ], 500);
        }
    }

    // 🧩 Khôi phục bài viết từ phiên bản cũ (protected)
    public function restoreVersion($postId, $versionId)
    {
        try {
            $post = Post::findOrFail($postId);
            $version = PostVersion::where('post_id', $postId)->find($versionId);

            if (!$version) {
                return response()->json([
                    'success' => false,
                    'message' => 'Phiên bản không tồn tại!'
                ], 404);
            }

            $user = auth()->user();

            if ($user->role !== 'admin' && $post->user_id !== $user->user_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bạn không có quyền khôi phục bài viết này!',
                ], 403);
            }

            // Lưu phiên bản hiện tại trước khi restore
            PostVersion::create([
                'post_id' => $post->post_id,
                'user_id' => $user->user_id,
                'post_category_id' => $post->post_category_id,
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
                'post_category_id' => $version->post_category_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Đã khôi phục bài viết về phiên bản trước đó',
                'data' => $post
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bài viết không tồn tại!'
            ], 404);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi server: '.$e->getMessage()
            ], 500);
        }
    }
}
