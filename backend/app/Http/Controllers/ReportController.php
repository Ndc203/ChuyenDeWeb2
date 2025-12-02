<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon; // <-- Import Carbon để xử lý ngày tháng
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\RevenueExport;

class ReportController extends Controller
{
    /**
     * API: GET /api/reports/revenue
     * Lấy dữ liệu báo cáo doanh thu
     */
    public function revenueReport(Request $request)
    {
        // 1. Validate và lấy Input
        $request->validate([
            'type' => 'string|in:daily,monthly,yearly',
            'date' => 'date',
        ]);
        
        $type = $request->input('type', 'daily');
        $date = Carbon::parse($request->input('date', now()));

        // 2. Xác định phạm vi ngày
        if ($type === 'daily') {
            $startDate = $date->copy()->startOfDay();
            $endDate = $date->copy()->endOfDay();
        } elseif ($type === 'monthly') {
            $startDate = $date->copy()->startOfMonth();
            $endDate = $date->copy()->endOfMonth();
        } else { // yearly
            $startDate = $date->copy()->startOfYear();
            $endDate = $date->copy()->endOfYear();
        }

        // 3. Lấy ra các đơn hàng "Hoàn thành" trong phạm vi ngày
        // QUAN TRỌNG: Doanh thu chỉ tính trên đơn "Hoàn thành"
        // và dựa trên 'updated_at' (ngày đơn hàng được đánh dấu hoàn thành)
        $completedOrdersQuery = Order::where('status', 'Hoàn thành')
                                     ->whereBetween('updated_at', [$startDate, $endDate]);

        // 4. Lấy danh sách đơn hàng đã hoàn thành (cho Card 1)
        $completedOrders = $completedOrdersQuery
                            ->with('customer.profile') // Lấy kèm thông tin người đặt
                            ->latest('updated_at') // Mới nhất lên đầu
                            ->get();

        // 5. Tính 3 Thẻ Thống Kê (Stats)
        $totalRevenue = $completedOrders->sum('final_amount');
        $orderCount = $completedOrders->count();

        // Lấy ID của các đơn hàng đã hoàn thành
        $completedOrderIds = $completedOrders->pluck('order_id');

        // 6. Lấy danh sách Sản phẩm đã bán
        $productsSold = OrderItem::whereIn('order_id', $completedOrderIds)
                                ->select(
                                    'product_name', 
                                    'product_id', 
                                    DB::raw('SUM(quantity) as total_quantity'),
                                    DB::raw('SUM(unit_price * quantity) as total_revenue')
                                )
                                ->groupBy('product_name', 'product_id')
                                ->orderBy('total_quantity', 'desc') // Bán chạy nhất lên đầu
                                ->get();
        
        // 7. Tính tổng sản phẩm đã bán
        $productsSoldCount = $productsSold->sum('total_quantity');

        // 8. Trả về JSON
        return response()->json([
            'stats' => [
                'totalRevenue' => $totalRevenue,
                'orderCount' => $orderCount,
                'productsSoldCount' => $productsSoldCount,
            ],
            'completedOrders' => $completedOrders,
            'productsSold' => $productsSold,
        ]);
    }

    public function exportRevenue(Request $request)
    {
        $type = $request->query('type', 'daily');
        $date = $request->query('date', now()->toDateString());

        $fileName = "bao_cao_doanh_thu_{$type}_{$date}.xlsx";

        return Excel::download(new RevenueExport($type, $date), $fileName);
    }
}