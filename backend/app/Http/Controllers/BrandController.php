<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Services\BrandImportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
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
                'updated_at' => optional($brand->updated_at)?->format('Y-m-d H:i:s'),
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
            'description' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ], [
            'name.required' => 'Ten thuong hieu khong duoc de trong.',
            'name.string' => 'Ten thuong hieu khong hop le.',
            'name.max' => 'Ten thuong hieu khong duoc vuot 255 ky tu.',
            'name.unique' => 'Ten thuong hieu da ton tai.',
            'description.string' => 'Mo ta phai la chuoi ky tu.',
            'description.max' => 'Mo ta khong duoc vuot 255 ky tu.',
            'status.in' => 'Trang thai chi chap nhan active hoac inactive.',
        ]);

        if (isset($data['description'])) {
            $data['description'] = Str::limit(strip_tags($data['description']), 255, '');
            if ($data['description'] === '') {
                $data['description'] = null;
            }
        }

        $data['status'] = $data['status'] ?? 'active';

        $brand = Brand::create($data)->refresh();

        return response()->json([
            'message' => 'Tao thuong hieu thanh cong.',
            'data' => [
                'id' => $brand->brand_id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'description' => $brand->description,
                'status' => $brand->status,
                'updated_at' => optional($brand->updated_at)?->format('Y-m-d H:i:s'),
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
            'description' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'required', 'string', Rule::in(['active', 'inactive'])],
            'updated_at' => ['required', 'date_format:Y-m-d H:i:s'],
        ], [
            'name.required' => 'Ten thuong hieu khong duoc de trong.',
            'name.string' => 'Ten thuong hieu khong hop le.',
            'name.max' => 'Ten thuong hieu khong duoc vuot 255 ky tu.',
            'name.unique' => 'Ten thuong hieu da ton tai.',
            'description.string' => 'Mo ta phai la chuoi ky tu.',
            'description.max' => 'Mo ta khong duoc vuot 255 ky tu.',
            'status.in' => 'Trang thai chi chap nhan active hoac inactive.',
            'updated_at.required' => 'Thieu phien ban du lieu. Vui long tai lai trang.',
            'updated_at.date_format' => 'Du lieu cap nhat khong hop le.',
        ]);

        $currentVersion = optional($brand->updated_at)?->format('Y-m-d H:i:s');

        if ($currentVersion !== $data['updated_at']) {
            return response()->json([
                'message' => 'Du lieu da thay doi. Vui long tai lai trang roi thao tac lai.',
            ], 409, [], JSON_UNESCAPED_UNICODE);
        }

        unset($data['updated_at']);

        if (isset($data['description'])) {
            $data['description'] = Str::limit(strip_tags($data['description']), 255, '');
            if ($data['description'] === '') {
                $data['description'] = null;
            }
        }

        $brand->update($data);
        $brand->refresh();

        return response()->json([
            'message' => 'Cap nhat thuong hieu thanh cong.',
            'data' => [
                'id' => $brand->brand_id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'description' => $brand->description,
                'status' => $brand->status,
                'updated_at' => optional($brand->updated_at)?->format('Y-m-d H:i:s'),
                'created_at' => optional($brand->created_at)?->format('Y-m-d H:i'),
            ],
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function destroy($id)
    {
        $brand = Brand::findOrFail($id);

        if ($brand->products()->exists()) {
            return response()->json([
                'ok' => false,
                'message' => 'Khong the xoa thuong hieu vi dang co san pham su dung.',
            ], 409, [], JSON_UNESCAPED_UNICODE);
        }

        $brand->delete();

        return response()->json([
            'ok' => true,
            'id' => $brand->brand_id,
            'message' => 'Da chuyen thuong hieu vao thung rac.',
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
            'message' => 'Cap nhat trang thai thuong hieu thanh cong.',
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
                'updated_at' => optional($brand->updated_at)?->format('Y-m-d H:i:s'),
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
            'message' => 'Khoi phuc thuong hieu thanh cong.',
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
                    'message' => 'Mot so dong duoc chon khong ton tai trong du lieu xem truoc.',
                    'missing_indexes' => $missing,
                ], 422, [], JSON_UNESCAPED_UNICODE);
            }
        }

        $result = $this->importService->import($parsed['rows'], $selected);

        return response()->json([
            'message' => 'Nhap thuong hieu hoan tat.',
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

        $limited = Str::limit($text, Brand::SLUG_MAX_LENGTH, '');
        $baseSlug = Str::slug($limited) ?: 'brand';
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
                'Ten thuong hieu' => $brand->name,
                'Slug' => $brand->slug,
                'Trang thai' => $brand->status,
                'Mo ta' => $brand->description ?? '',
                'Ngay tao' => optional($brand->created_at)?->format('Y-m-d H:i'),
            ])
            ->values()
            ->toArray();

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('brands_export', ['rows' => $rows]);
            return $pdf->download($filename . '.pdf');
        }

        if ($format !== 'excel') {
            return response()->json([
                'message' => 'Dinh dang xuat khong hop le.',
            ], 422, [], JSON_UNESCAPED_UNICODE);
        }

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $headers = [
            'A' => 'ID',
            'B' => 'Ten thuong hieu',
            'C' => 'Slug',
            'D' => 'Trang thai',
            'E' => 'Mo ta',
            'F' => 'Ngay tao',
        ];

        foreach ($headers as $column => $title) {
            $sheet->setCellValue($column . '1', $title);
        }

        $rowIndex = 2;
        foreach ($rows as $row) {
            $sheet->setCellValue("A{$rowIndex}", $row['ID']);
            $sheet->setCellValue("B{$rowIndex}", $row['Ten thuong hieu']);
            $sheet->setCellValue("C{$rowIndex}", $row['Slug']);
            $sheet->setCellValue("D{$rowIndex}", $row['Trang thai']);
            $sheet->setCellValue("E{$rowIndex}", $row['Mo ta']);
            $sheet->setCellValue("F{$rowIndex}", $row['Ngay tao']);
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
