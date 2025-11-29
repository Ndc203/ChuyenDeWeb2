<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PostCategory;
use PDF;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\PostCategoriesExport;
use Illuminate\Support\Facades\DB;

class PostCategoryController extends Controller
{
     public function export(Request $request)
    {
        $format = $request->query('format', 'excel'); // excel | pdf
        $categories = PostCategory::orderByDesc('post_category_id')->get();

        if ($format === 'pdf') {
            // View Blade phải dùng đúng key: post_category_id
            $pdf = PDF::loadView('postcategories_pdf', compact('categories'))
                ->setPaper('a4', 'portrait');

            return $pdf->download('postcategories.pdf');
        }

        if ($format === 'excel') {
            return Excel::download(new PostCategoriesExport, 'postcategories.xlsx');
        }

        return response()->json(['error' => 'Invalid format'], 400);
    }

    /**
     * Danh sách
     */
    public function index()
    {
        $categories = PostCategory::orderByDesc('post_category_id')->get();
        return response()->json($categories);
    }

    /**
     * Normalize input: trim all whitespace, convert full-width space & digits
     */
    private function normalize($value)
    {
        if (!is_string($value)) return $value;

        // Convert full-width digits: ０１２３４５６７８９ => 0123456789
        $value = preg_replace_callback('/[０-９]/u', function ($m) {
            return mb_ord($m[0]) - mb_ord('０');
        }, $value);

        // Convert full-width spaces (U+3000) to normal spaces
        $value = str_replace("\u{3000}", ' ', $value);

        // Trim Unicode whitespace
        return trim(preg_replace('/\s+/u', ' ', $value));
    }

    /**
     * Validate ID param (fix lỗi id=abc hoặc id quá lớn)
     */
    private function validateId($id)
    {
        if (!ctype_digit((string)$id)) {
            return response()->json(['message' => 'ID không hợp lệ.'], 400);
        }

        if ($id > 9223372036854775807) {
            return response()->json(['message' => 'ID không hợp lệ.'], 400);
        }

        return null;
    }

    /**
     * Thêm mới
     */
    public function store(Request $request)
    {
        // Normalize tất cả input
        $request->merge([
            'name' => $this->normalize($request->name),
            'description' => $this->normalize($request->description),
        ]);

        // Nếu toàn khoảng trắng
        if ($request->name === '') {
            return response()->json(['message' => 'Tên không được bỏ trống hoặc chỉ chứa khoảng trắng.'], 422);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:postcategories,name',
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $category = PostCategory::create($validated);
        } catch (\Exception $e) {
            // Chống nhấn nút lưu liên tục → trùng lặp
            return response()->json(['message' => 'Dữ liệu đã tồn tại hoặc thao tác không hợp lệ.'], 409);
        }

        return response()->json([
            'message' => 'Thêm danh mục thành công!',
            'data' => $category
        ], 201);
    }

    /**
     * Chi tiết
     */
    public function show($id)
    {
        if ($bad = $this->validateId($id)) return $bad;

        $category = PostCategory::find($id);
        if (!$category) {
            return response()->json(['message' => 'Không tìm thấy danh mục.'], 404);
        }

        return response()->json($category);
    }

    /**
     * Cập nhật
     */
    public function update(Request $request, $id)
    {
        if ($bad = $this->validateId($id)) return $bad;

        $category = PostCategory::find($id);
        if (!$category) {
            return response()->json(['message' => 'Không tìm thấy danh mục.'], 404);
        }

        // Normalize input
        $request->merge([
            'name' => $this->normalize($request->name),
            'description' => $this->normalize($request->description),
        ]);

        if ($request->name === '') {
            return response()->json(['message' => 'Tên không được bỏ trống hoặc chỉ chứa khoảng trắng.'], 422);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:postcategories,name,' . $id . ',post_category_id',
            'description' => 'nullable|string|max:500',
        ]);

        try {
            $category->update($validated);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Dữ liệu đã bị thay đổi. Hãy tải lại trang trước khi cập nhật.'], 409);
        }

        return response()->json([
            'message' => 'Cập nhật thành công!',
            'data' => $category
        ]);
    }

    /**
     * Xóa — fix lỗi delete 2 tab
     */
    public function destroy($id)
    {
        if ($bad = $this->validateId($id)) return $bad;

        // Xóa an toàn bằng affectedRows
        $deleted = PostCategory::where('post_category_id', $id)->delete();

        if ($deleted === 0) {
            return response()->json(['message' => 'Danh mục không tồn tại hoặc đã bị xoá trước đó.'], 404);
        }

        return response()->json(['message' => 'Đã xoá danh mục.']);
    }
}
