<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Services\BrandImportService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class BrandController extends Controller
{
    public function __construct(private BrandImportService $importService)
    {
    }

    public function index()
    {
        $rows = Brand::query()
            ->orderBy('brand_id')
            ->get()
            ->map(fn (Brand $brand) => [
                'id' => $brand->brand_id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'description' => $brand->description,
                'status' => $brand->status,
                'created_at' => optional($brand->created_at)?->format('Y-m-d H:i'),
            ]);

        return response()->json($rows->values(), 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('brands', 'name')->whereNull('deleted_at'),
            ],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ]);

        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }

        $brand = Brand::create($data)->refresh();

        return response()->json([
            'message' => 'Tạo thương hiệu thành công.',
            'data' => [
                'id' => $brand->brand_id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'description' => $brand->description,
                'status' => $brand->status,
                'created_at' => optional($brand->created_at)?->format('Y-m-d H:i'),
            ],
        ], 201, [], JSON_UNESCAPED_UNICODE);
    }

    public function update(Request $request, $id)
    {
        $brand = Brand::findOrFail($id);

        $data = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('brands', 'name')
                    ->ignore($brand->brand_id, 'brand_id')
                    ->whereNull('deleted_at'),
            ],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'required', 'string', Rule::in(['active', 'inactive'])],
        ]);

        $brand->update($data);
        $brand->refresh();

        return response()->json([
            'message' => 'Cập nhật thương hiệu thành công.',
            'data' => [
                'id' => $brand->brand_id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'description' => $brand->description,
                'status' => $brand->status,
                'created_at' => optional($brand->created_at)?->format('Y-m-d H:i'),
            ],
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function destroy($id)
    {
        $brand = Brand::findOrFail($id);
        $brand->delete();

        return response()->json([
            'ok' => true,
            'id' => $brand->brand_id,
            'message' => 'Đã chuyển thương hiệu vào thùng rác.',
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function toggleStatus($id)
    {
        $brand = Brand::findOrFail($id);
        $brand->status = $brand->status === 'active' ? 'inactive' : 'active';
        $brand->save();

        return response()->json([
            'ok' => true,
            'id' => $brand->brand_id,
            'status' => $brand->status,
            'message' => 'Cập nhật trạng thái thương hiệu thành công.',
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function trashed()
    {
        $this->purgeExpiredTrashed();

        $rows = Brand::onlyTrashed()
            ->orderByDesc('deleted_at')
            ->get()
            ->map(fn (Brand $brand) => [
                'id' => $brand->brand_id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'description' => $brand->description,
                'status' => $brand->status,
                'deleted_at' => optional($brand->deleted_at)?->format('Y-m-d H:i'),
                'auto_delete_at' => $brand->deleted_at
                    ? $brand->deleted_at->copy()->addDays(30)->format('Y-m-d H:i')
                    : null,
                'created_at' => optional($brand->created_at)?->format('Y-m-d H:i'),
            ]);

        return response()->json($rows->values(), 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function restore($id)
    {
        $brand = Brand::onlyTrashed()->findOrFail($id);
        $brand->restore();

        return response()->json([
            'ok' => true,
            'id' => $brand->brand_id,
            'message' => 'Khôi phục thương hiệu thành công.',
        ], 200, [], JSON_UNESCAPED_UNICODE);
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
            $availableIndexes = array_map(
                fn ($row) => (int) $row['index'],
                $parsed['rows']
            );
            $missing = array_values(array_diff($selected, $availableIndexes));

            if (count($missing)) {
                return response()->json([
                    'message' => 'Một số dòng được chọn không tồn tại trong dữ liệu xem trước.',
                    'missing_indexes' => $missing,
                ], 422, [], JSON_UNESCAPED_UNICODE);
            }
        }

        $result = $this->importService->import($parsed['rows'], $selected);

        return response()->json([
            'message' => 'Nhập thương hiệu hoàn tất.',
            'created' => $result['created'],
            'errors' => $result['errors'],
            'summary' => $result['summary'],
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function slugify(Request $request)
    {
        $text = $request->query('text', '');
        $ignore = $request->query('ignore');
        $ignoreId = $ignore !== null ? (int) $ignore : null;

        $baseSlug = Str::slug($text) ?: 'brand';
        $slug = Brand::generateUniqueSlug($text, $ignoreId);

        $exists = Brand::withTrashed()
            ->when($ignoreId, fn ($query) => $query->where('brand_id', '!=', $ignoreId))
            ->where('slug', $baseSlug)
            ->exists();

        return response()->json([
            'slug' => $slug,
            'base' => $baseSlug,
            'available' => !$exists,
            'modified' => $slug !== $baseSlug,
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function export(Request $request)
    {
        $format = $request->query('format', 'excel');
        $filename = 'brands_' . now()->format('Ymd_His');

        $rows = Brand::query()
            ->orderBy('brand_id')
            ->get()
            ->map(fn (Brand $brand) => [
                'ID' => $brand->brand_id,
                'Tên thương hiệu' => $brand->name,
                'Slug' => $brand->slug,
                'Trạng thái' => $brand->status,
                'Mô tả' => $brand->description ?? '',
                'Ngày tạo' => optional($brand->created_at)?->format('Y-m-d H:i'),
            ])
            ->values()
            ->toArray();

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('brands_export', ['rows' => $rows]);
            return $pdf->download($filename . '.pdf');
        }

        if ($format !== 'excel') {
            return response()->json([
                'message' => 'Định dạng xuất không hợp lệ.',
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $headers = [
            'A' => 'ID',
            'B' => 'Tên thương hiệu',
            'C' => 'Slug',
            'D' => 'Trạng thái',
            'E' => 'Mô tả',
            'F' => 'Ngày tạo',
        ];

        foreach ($headers as $column => $title) {
            $sheet->setCellValue($column . '1', $title);
        }

        $rowIndex = 2;
        foreach ($rows as $row) {
            $sheet->setCellValue("A{$rowIndex}", $row['ID']);
            $sheet->setCellValue("B{$rowIndex}", $row['Tên thương hiệu']);
            $sheet->setCellValue("C{$rowIndex}", $row['Slug']);
            $sheet->setCellValue("D{$rowIndex}", $row['Trạng thái']);
            $sheet->setCellValue("E{$rowIndex}", $row['Mô tả']);
            $sheet->setCellValue("F{$rowIndex}", $row['Ngày tạo']);
            $rowIndex++;
        }

        foreach (range('A', 'F') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename . '.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    private function purgeExpiredTrashed(): void
    {
        Brand::pruneTrashedOlderThanDays();
    }
}
