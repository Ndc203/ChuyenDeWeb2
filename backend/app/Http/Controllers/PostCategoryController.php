<?php

namespace App\Http\Controllers;

use App\Models\PostCategory;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\PostCategoriesExport;
use Barryvdh\DomPDF\Facade\Pdf;

class PostCategoryController extends Controller
{
    /**
     * Hiển thị danh sách tất cả danh mục bài viết
     */
    public function index()
    {
        $categories = PostCategory::orderByDesc('post_category_id')->get();
        return response()->json($categories);
    }

    /**
     * Thêm danh mục mới
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:postcategories,name',
            'description' => 'nullable|string|max:500',
        ]);

        $category = PostCategory::create($validated);

        return response()->json([
            'message' => 'Thêm danh mục thành công!',
            'data' => $category
        ], 201);
    }

    /**
     * Hiển thị chi tiết danh mục
     */
    public function show($id)
    {
        $category = PostCategory::find($id);

        if (!$category) {
            return response()->json(['message' => 'Không tìm thấy danh mục.'], 404);
        }

        return response()->json($category);
    }

    /**
     * Cập nhật danh mục
     */
    public function update(Request $request, $id)
    {
        $category = PostCategory::find($id);

        if (!$category) {
            return response()->json(['message' => 'Không tìm thấy danh mục.'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:postcategories,name,' . $id . ',post_category_id',
            'description' => 'nullable|string|max:500',
        ]);

        $category->update($validated);

        return response()->json([
            'message' => 'Cập nhật danh mục thành công!',
            'data' => $category
        ]);
    }

    /**
     * Xóa danh mục
     */
    public function destroy($id)
    {
        $category = PostCategory::find($id);

        if (!$category) {
            return response()->json(['message' => 'Không tìm thấy danh mục.'], 404);
        }

        $category->delete();

        return response()->json(['message' => 'Đã xoá danh mục.']);
    }

    /**
     * Xuất dữ liệu
     */
    public function export(Request $request)
    {
        $format = $request->query('format', 'excel');
        $categories = PostCategory::all(['post_category_id', 'name', 'description', 'created_at']);

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('postcategories_pdf', [
                'categories' => $categories
            ]);
            return $pdf->download('postcategories.pdf');
        }

        return Excel::download(new PostCategoriesExport, 'postcategories.xlsx');
    }
}
