<?php

namespace App\Http\Controllers;

use App\Models\PostCategory;
use Illuminate\Http\Request;

class PostCategoryController extends Controller
{
    public function index()
    {
        return response()->json(PostCategory::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category = PostCategory::create($validated);

        return response()->json([
            'message' => 'Danh mục đã được tạo thành công!',
            'data' => $category,
        ]);
    }

    public function show($id)
    {
        $category = PostCategory::findOrFail($id);
        return response()->json($category);
    }

    public function update(Request $request, $id)
    {
        $category = PostCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Danh mục đã được cập nhật thành công!',
            'data' => $category,
        ]);
    }

    public function destroy($id)
    {
        PostCategory::findOrFail($id)->delete();
        return response()->json(['message' => 'Danh mục đã bị xóa']);
    }
}
