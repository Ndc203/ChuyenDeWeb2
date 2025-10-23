<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Csv;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class CategoryController extends Controller
{
    public function index()
    {
        $rows = Category::with('parent:category_id,name')
            ->orderBy('category_id')
            ->get()
            ->map(fn (Category $category) => [
                'id' => $category->category_id,
                'name' => $category->name,
                'slug' => $category->slug,
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
            'message' => 'Category created successfully.',
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
            'message' => 'Category updated successfully.',
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
            'message' => 'Status updated successfully.',
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
                'Name' => $category->name,
                'Slug' => $category->slug,
                'Parent' => optional($category->parent)->name ?? 'Root',
                'Status' => $category->status,
                'Created At' => optional($category->created_at)?->format('Y-m-d H:i'),
            ])
            ->values()
            ->toArray();

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('categories_export', ['rows' => $rows]);
            return $pdf->download($filename . '.pdf');
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $headers = ['A' => 'ID', 'B' => 'Name', 'C' => 'Slug', 'D' => 'Parent', 'E' => 'Status', 'F' => 'Created At'];
        foreach ($headers as $column => $title) {
            $sheet->setCellValue($column . '1', $title);
        }

        $rowIndex = 2;
        foreach ($rows as $row) {
            $sheet->setCellValue("A{$rowIndex}", $row['ID']);
            $sheet->setCellValue("B{$rowIndex}", $row['Name']);
            $sheet->setCellValue("C{$rowIndex}", $row['Slug']);
            $sheet->setCellValue("D{$rowIndex}", $row['Parent']);
            $sheet->setCellValue("E{$rowIndex}", $row['Status']);
            $sheet->setCellValue("F{$rowIndex}", $row['Created At']);
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
}
