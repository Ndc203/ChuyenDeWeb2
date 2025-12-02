<?php

namespace App\Exports;

use App\Models\Order;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;

class RevenueExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithColumnFormatting
{
    protected $type;
    protected $date;
    protected $totalRevenue = 0;
    protected $rowCount = 0;

    public function __construct($type, $date)
    {
        $this->type = $type;
        $this->date = $date;
    }

    public function collection()
    {
        $query = Order::query()->with('items');

        // 1. QUAN TRỌNG: Chỉ lấy đơn đã hoàn thành để tính doanh thu thực tế
        // Bạn hãy sửa chữ 'Hoàn thành' cho khớp với Database của bạn (ví dụ: 'completed', 'success'...)
        $query->whereIn('status', ['Hoàn thành', 'completed', 'success', 'delivered']);

        // 2. SỬA LOGIC LỌC: Dùng 'updated_at' thay vì 'created_at'
        // Để đơn đặt tháng 3 nhưng xong tháng 11 sẽ nằm trong báo cáo tháng 11
        if ($this->type === 'daily') {
            $query->whereDate('updated_at', $this->date);
        } elseif ($this->type === 'monthly') {
            $query->whereYear('updated_at', Carbon::parse($this->date)->year)
                  ->whereMonth('updated_at', Carbon::parse($this->date)->month);
        } elseif ($this->type === 'yearly') {
            $query->whereYear('updated_at', Carbon::parse($this->date)->year);
        }

        // Sắp xếp theo ngày hoàn thành
        $query->orderBy('updated_at', 'desc');

        $orders = $query->get();

        // Tính tổng
        $this->totalRevenue = $orders->sum('final_amount');
        $this->rowCount = $orders->count();

        // Thêm dòng tổng cộng vào cuối
        $orders->push((object)[
            'is_total_row' => true,
            'final_amount' => $this->totalRevenue
        ]);

        return $orders;
    }

    public function headings(): array
    {
        return [
            'Mã đơn hàng',
            'Khách hàng',
            'Chi tiết sản phẩm',
            'Ngày đặt',
            'Ngày hoàn thành', // <--- CỘT MỚI
            'Tổng tiền đơn (VNĐ)',
            'Trạng thái',
        ];
    }

    public function map($row): array
    {
        // Xử lý dòng tổng cộng
        if (isset($row->is_total_row)) {
            return [
                '', '', '', '', 
                'TỔNG DOANH THU:', // Dời label sang cột Ngày hoàn thành cho đẹp
                $row->final_amount,
                ''
            ];
        }

        // Xử lý chi tiết sản phẩm
        $productDetails = $row->items->map(function($item) {
            return "{$item->product_name} (x{$item->quantity})";
        })->implode(', ');

        return [
            $row->order_id,
            $row->customer_name,
            $productDetails,
            $row->created_at->format('d/m/Y H:i'),     // Ngày đặt
            $row->updated_at->format('d/m/Y H:i'),     // <--- CỘT MỚI: Ngày hoàn thành
            $row->final_amount,
            $row->status,
        ];
    }

    public function columnFormats(): array
    {
        return [
            'F' => '#,##0', // Cột Tiền bây giờ dời sang cột F (A,B,C,D,E,F...)
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $lastRow = $this->rowCount + 2;
        return [
            1 => ['font' => ['bold' => true]],
            $lastRow => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FF0000']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['argb' => 'FFFF00']]
            ],
        ];
    }
}