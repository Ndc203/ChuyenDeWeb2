<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Product;
use App\Models\Order;

class DashboardController extends Controller
{
    public function statistics()
    {
        // 1. Tổng số lượng (Card thống kê)
        $totalProducts = Product::count();
        $totalUsers = User::count();
        
        // Nếu bạn chưa có bảng Post, ta dùng số lượng Đơn hàng thay thế
        $totalOrders = Order::count(); 
        
        // Giả lập hoạt động hôm nay (Ví dụ: số đơn hàng mới hôm nay)
        $activeToday = Order::whereDate('created_at', now()->today())->count();

        // 2. Thống kê cho Biểu đồ Tròn (Users by Role)
        // Query: Đếm số user theo từng role (admin, user, staff...)
        $usersByRole = User::select('role', DB::raw('count(*) as value'))
            ->groupBy('role')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => ucfirst($item->role ?? 'Khách'), // Nếu role null thì gọi là Khách
                    'value' => $item->value
                ];
            });

        // 3. Thống kê cho Biểu đồ Đường (Orders by Month)
        // Query: Đếm số đơn hàng theo từng tháng trong năm nay
        $ordersData = Order::select(
            DB::raw('MONTH(created_at) as month'),
            DB::raw('COUNT(*) as count')
        )
        ->whereYear('created_at', date('Y')) // Chỉ lấy năm hiện tại
        ->groupBy('month')
        ->orderBy('month')
        ->get();

        // Chuẩn hóa dữ liệu: Đảm bảo đủ 12 tháng (tháng nào ko có đơn thì = 0)
        $postsByMonth = [];
        for ($i = 1; $i <= 12; $i++) {
            $monthData = $ordersData->firstWhere('month', $i);
            $postsByMonth[] = [
                'month' => (string)$i, // Recharts cần string cho trục X
                'posts' => $monthData ? $monthData->count : 0
            ];
        }

        // 4. Trả về JSON đúng cấu trúc Frontend mong đợi
        return response()->json([
            'total_products' => $totalProducts,
            'total_users'    => $totalUsers,
            'total_posts'    => $totalOrders, // Map Order count vào đây
            'active_today'   => $activeToday,
            'users_by_role'  => $usersByRole,
            'posts_by_month' => $postsByMonth, // Dữ liệu biểu đồ đường
        ]);
    }
}