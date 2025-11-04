<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Services\CategoryImportService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class CategoryController extends Controller
{
    public function __construct(private CategoryImportService $importService)
    {
    }

    public function index()
    {
        $rows = Category::with('parent:category_id,name')
            ->orderBy('category_id')
            ->get()
            ->map(fn (Category $category) => [
                'id' => $category->category_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'parent_id' => $category->parent_id,
                'parent' => optional($category->parent)->name,
                'status' => $category->status,
                'created_at' => optional($category->created_at)?->format('Y-m-d H:i'),
            ]);

        return response()->json($rows->values(), 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,category_id'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ]);

        $category = Category::create($data);

        return response()->json([
            'message' => 'Tạo danh mục thành công.',
            'data' => $category->fresh('parent'),
        ], 201, [], JSON_UNESCAPED_UNICODE);
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,category_id'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ]);

        $category->update($data);

        return response()->json([
            'message' => 'Cập nhật danh mục thành công.',
            'data' => $category->fresh('parent'),
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function slugify(Request $request)
    {
        $name = $request->query('text', '');
        $ignore = $request->query('ignore');

        $slug = Category::generateUniqueSlug(
            $name,
            $ignore !== null ? (int) $ignore : null
        );

        return response()->json(['slug' => $slug], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function toggleStatus($id)
    {
        $category = Category::findOrFail($id);
        $category->status = $category->status === 'active' ? 'inactive' : 'active';
        $category->save();

        return response()->json([
            'ok' => true,
            'id' => $category->category_id,
            'status' => $category->status,
            'message' => 'Cập nhật trạng thái thành công.',
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function trashed()
    {
        $this->purgeExpiredTrashed();

        $rows = Category::onlyTrashed()
            ->with('parent:category_id,name')
            ->orderBy('category_id')
            ->get()
            ->map(fn (Category $category) => [
                'id' => $category->category_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'parent_id' => $category->parent_id,
                'parent' => optional($category->parent)->name,
                'status' => $category->status,
                'deleted_at' => optional($category->deleted_at)?->format('Y-m-d H:i'),
                'auto_delete_at' => $category->deleted_at
                    ? $category->deleted_at->copy()->addDays(30)->format('Y-m-d H:i')
                    : null,
                'created_at' => optional($category->created_at)?->format('Y-m-d H:i'),
            ]);

        return response()->json($rows->values(), 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function destroy($id)
    {
        $category = Category::withCount('children')->findOrFail($id);

        if ($category->children_count > 0) {
            return response()->json([
                'message' => 'Không thể xóa danh mục khi vẫn còn danh mục con.',
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $category->delete();

        return response()->json([
            'ok' => true,
            'id' => $category->category_id,
            'message' => 'Xóa danh mục thành công.',
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function restore($id)
    {
        $category = Category::onlyTrashed()->findOrFail($id);

        if ($category->parent_id !== null) {
            $parent = Category::withTrashed()->find($category->parent_id);
            if ($parent && $parent->trashed()) {
                return response()->json([
                    'message' => 'Không thể khôi phục vì danh mục cha vẫn đang bị xóa.',
                ], 422, [], JSON_UNESCAPED_UNICODE);
            }
        }

        $category->restore();

        return response()->json([
            'ok' => true,
            'id' => $category->category_id,
            'message' => 'Khôi phục danh mục thành công.',
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function export(Request $request)
    {
        $format = $request->query('format', 'excel');
        $filename = 'categories_' . now()->format('Ymd_His');

        $rows = Category::with('parent:category_id,name')
            ->orderBy('category_id')
            ->get()
            ->map(fn (Category $category) => [
                'ID' => $category->category_id,
                'Tên danh mục' => $category->name,
                'Slug' => $category->slug,
                'Danh mục cha' => optional($category->parent)->name ?? 'Gốc',
                'Trạng thái' => $category->status,
                'Ngày tạo' => optional($category->created_at)?->format('Y-m-d H:i'),
            ])
            ->values()
            ->toArray();

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('categories_export', ['rows' => $rows]);
            return $pdf->download($filename . '.pdf');
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $headers = ['A' => 'ID', 'B' => 'Tên danh mục', 'C' => 'Slug', 'D' => 'Danh mục cha', 'E' => 'Trạng thái', 'F' => 'Ngày tạo'];
        foreach ($headers as $column => $title) {
            $sheet->setCellValue($column . '1', $title);
        }

        $rowIndex = 2;
        foreach ($rows as $row) {
            $sheet->setCellValue("A{$rowIndex}", $row['ID']);
            $sheet->setCellValue("B{$rowIndex}", $row['Tên danh mục']);
            $sheet->setCellValue("C{$rowIndex}", $row['Slug']);
            $sheet->setCellValue("D{$rowIndex}", $row['Danh mục cha']);
            $sheet->setCellValue("E{$rowIndex}", $row['Trạng thái']);
            $sheet->setCellValue("F{$rowIndex}", $row['Ngày tạo']);
            $rowIndex++;
        }

        foreach (range('A', 'F') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        if ($format === 'csv') {
            $writer = new Csv($spreadsheet);
            $writer->setDelimiter(',');
            $writer->setEnclosure('"');
            $writer->setSheetIndex(0);

            return response()->streamDownload(function () use ($writer) {
                $writer->save('php://output');
            }, $filename . '.csv', [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename . '.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function importPreview(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        $result = $this->importService->parse($request->file('file'));

        return response()->json($result, 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function import(Request $request)
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
            'selected' => ['nullable', 'array'],
            'selected.*' => ['integer'],
        ]);

        $parsed = $this->importService->parse($request->file('file'));

        $selected = $data['selected'] ?? null;
        if ($selected !== null) {
            $selected = array_map('intval', $selected);
            $availableIndexes = array_map(fn ($row) => (int) $row['index'], $parsed['rows']);
            $missing = array_values(array_diff($selected, $availableIndexes));
            if (count($missing)) {
                return response()->json([
                    'message' => 'Một số dòng không tồn tại trong file đã tải lên.',
                    'missing_indexes' => $missing,
                ], 422, [], JSON_UNESCAPED_UNICODE);
            }
        }

        $result = $this->importService->import($parsed['rows'], $selected);

        return response()->json([
            'message' => 'Nhập danh mục hoàn tất.',
            'created' => $result['created'],
            'errors' => $result['errors'],
            'summary' => $result['summary'],
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    private function purgeExpiredTrashed(): void
    {
        Category::pruneTrashedOlderThanDays();
    }
}
