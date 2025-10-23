<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Writer\Csv;

class CategoryController extends Controller
{
    public function index()
    {
        $rows = Category::select(['category_id','name','parent_id','status','created_at'])
            ->with(['parent:category_id,name'])
            ->orderBy('category_id','asc')
            ->get()
            ->map(fn($c) => [
                'id'         => $c->category_id,
                'name'       => $c->name,
                'parent'     => optional($c->parent)->name,
                'status'     => $c->status,
                'created_at' => optional($c->created_at)?->format('Y-m-d H:i'),
            ]);

        return response()->json($rows->values(), 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function toggleStatus($id)
    {
        $cat = Category::findOrFail($id);
        $cat->status = $cat->status === 'active' ? 'inactive' : 'active';
        $cat->save();

        return response()->json([
            'ok'     => true,
            'id'     => $cat->category_id,
            'status' => $cat->status,
            'message'=> 'Cập nhật trạng thái thành công'
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function export(Request $request)
    {
        $format = $request->query('format', 'excel'); // excel|pdf|csv
        $filename = 'categories_'.date('Ymd_His');

        $rows = Category::with('parent:category_id,name')
            ->orderBy('category_id')
            ->get()
            ->map(fn($c) => [
                'ID'            => $c->category_id,
                'Tên danh mục'  => $c->name,
                'Danh mục cha'  => optional($c->parent)->name ?? 'Danh mục gốc',
                'Trạng thái'    => $c->status,
                'Ngày tạo'      => optional($c->created_at)?->format('Y-m-d H:i'),
            ])
            ->values()
            ->toArray();

        // ========== PDF ==========
        if ($format === 'pdf') {
            $pdf = Pdf::loadView('categories_export', ['rows' => $rows]); // ✅ Dùng PDF facade
            return $pdf->download($filename.'.pdf');
        }

        // ========== EXCEL / CSV ==========
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Tiêu đề cột (vì setCellValueByColumnAndRow không còn ở PhpSpreadsheet 2.x)
        $headers = ['A' => 'ID', 'B' => 'Tên danh mục', 'C' => 'Danh mục cha', 'D' => 'Trạng thái', 'E' => 'Ngày tạo'];
        foreach ($headers as $column => $title) {
        $sheet->setCellValue($column.'1', $title);
}


        // Dòng dữ liệu
        $r = 2;
        foreach ($rows as $row) {
            $sheet->setCellValue("A{$r}", $row['ID']);
            $sheet->setCellValue("B{$r}", $row['Tên danh mục']);
            $sheet->setCellValue("C{$r}", $row['Danh mục cha']);
            $sheet->setCellValue("D{$r}", $row['Trạng thái']);
            $sheet->setCellValue("E{$r}", $row['Ngày tạo']);
            $r++;
        }

        foreach (range('A','E') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        if ($format === 'csv') {
            $writer = new Csv($spreadsheet);
            $writer->setDelimiter(',');
            $writer->setEnclosure('"');
            $writer->setSheetIndex(0);

            return response()->streamDownload(function () use ($writer) {
                $writer->save('php://output');
            }, $filename.'.csv', [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        }

        // ========== Mặc định: EXCEL (XLSX) ==========
        $writer = new Xlsx($spreadsheet);
        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename.'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
