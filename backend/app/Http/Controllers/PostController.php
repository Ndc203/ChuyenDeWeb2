<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Str;


class PostController extends Controller
{
    public function index()
    {
        return Post::with(['category', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

 public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'nullable|exists:postcategories,id',
            'title' => 'required|string|max:255',
            'excerpt' => 'nullable|string',
            'content' => 'nullable|string',
            'status' => 'in:draft,published',
            'is_trending' => 'boolean',
            'image' => 'nullable|image|max:2048',
        ]);

        // Xử lý upload ảnh
        $imageName = null;
        if ($request->hasFile('image')) {
            $imageName = time() . '_' . Str::random(8) . '.' . $request->file('image')->getClientOriginalExtension();
            $request->file('image')->move(public_path('images/posts'), $imageName);
        }

        $post = Post::create([
            'user_id' => 1, 
            'category_id' => $validated['category_id'] ?? null,
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

    public function show($id)
    {
        return Post::with(['category', 'user'])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'sometimes|exists:postcategories,id',
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'excerpt' => 'nullable|string',
            'status' => 'in:draft,published',
            'is_trending' => 'boolean',
        ]);

        $post->update($validated);

        return response()->json($post);
    }

    public function destroy($id)
    {
        Post::findOrFail($id)->delete();
        return response()->json(['message' => 'Đã xóa bài viết']);
    }
}
