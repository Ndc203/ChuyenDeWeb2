<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class BrandController extends Controller
{
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
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'string', Rule::in(['active', 'inactive'])],
        ]);

        if (!isset($data['status'])) {
            $data['status'] = 'active';
        }

        $brand = Brand::create($data)->refresh();

        return response()->json([
            'message' => 'Brand created successfully.',
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
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'required', 'string', Rule::in(['active', 'inactive'])],
        ]);

        $brand->update($data);
        $brand->refresh();

        return response()->json([
            'message' => 'Brand updated successfully.',
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
            'message' => 'Brand moved to recycle bin successfully.',
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
            'message' => 'Brand status updated successfully.',
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
            'message' => 'Brand restored successfully.',
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
                'Name' => $brand->name,
                'Slug' => $brand->slug,
                'Status' => $brand->status,
                'Description' => $brand->description ?? '',
                'Created At' => optional($brand->created_at)?->format('Y-m-d H:i'),
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
            'B' => 'Name',
            'C' => 'Slug',
            'D' => 'Status',
            'E' => 'Description',
            'F' => 'Created At',
        ];

        foreach ($headers as $column => $title) {
            $sheet->setCellValue($column . '1', $title);
        }

        $rowIndex = 2;
        foreach ($rows as $row) {
            $sheet->setCellValue("A{$rowIndex}", $row['ID']);
            $sheet->setCellValue("B{$rowIndex}", $row['Name']);
            $sheet->setCellValue("C{$rowIndex}", $row['Slug']);
            $sheet->setCellValue("D{$rowIndex}", $row['Status']);
            $sheet->setCellValue("E{$rowIndex}", $row['Description']);
            $sheet->setCellValue("F{$rowIndex}", $row['Created At']);
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
        Brand::onlyTrashed()
            ->where('deleted_at', '<', now()->subDays(30))
            ->get()
            ->each->forceDelete();
    }
}
