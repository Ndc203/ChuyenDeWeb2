<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /**
     * API: GET /api/orders
     * Lấy danh sách đơn hàng có phân trang, lọc và tìm kiếm.
     */
    public function index(Request $request)
    {
        $query = Order::query();

        // 1. Eager Loading (Tải kèm profile của customer)
        // Chúng ta cần 'customer.profile' để tìm kiếm 'full_name'
        $query->with('customer.profile')->withCount('items as item_count');

        // 2. Lọc theo trạng thái
        if ($request->filled('status') && $request->status != 'all') {
            $query->where('status', $request->status);
        }

        // 3. Lọc theo tìm kiếm (ĐÃ SỬA LỖI)
        if ($request->filled('search')) {
            $search = $request->search;
            
            $query->where(function ($q) use ($search) {
                // Tìm trên bảng 'orders'
                $q->where('order_id', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%")
                  
                  // Tìm trên bảng 'users' (quan hệ 'customer')
                  ->orWhereHas('customer', function ($subQ) use ($search) {
                      $subQ->where('username', 'like', "%{$search}%") // Sửa: 'name' -> 'username'
                           ->orWhere('email', 'like', "%{$search}%");
                  })
                  
                  // MỚI: Tìm trên bảng 'userprofile' (quan hệ 'customer.profile')
                  ->orWhereHas('customer.profile', function ($subQ) use ($search) {
                      $subQ->where('full_name', 'like', "%{$search}%"); // Tìm 'full_name'
                  });
            });
        }

        // 4. Sắp xếp và Phân trang
        $orders = $query->latest()->paginate(10);

        return response()->json($orders);
    }

    /**
     * API: GET /api/orders/statistics
     * Lấy số liệu thống kê cho các thẻ StatCard.
     */
    public function statistics()
    {
        // Dùng 1 query duy nhất để lấy tất cả, rất nhanh
        $stats = Order::select('status', DB::raw('count(*) as count'))
                      ->groupBy('status')
                      ->pluck('count', 'status'); // Kết quả: ['Chờ thanh toán' => 45, 'Đang xử lý' => 123, ...]

        return response()->json([
            // 'total' là tổng của tất cả các trạng thái
            'total' => $stats->sum(), 
            
            // Trả về 0 nếu không có trạng thái đó
            'pending' => $stats['Chờ thanh toán'] ?? 0,
            'processing' => $stats['Đang xử lý'] ?? 0,
            'shipped' => $stats['Đang giao'] ?? 0,
            'completed' => $stats['Hoàn thành'] ?? 0,
            'cancelled' => $stats['Đã hủy'] ?? 0,
        ]);
    }
    
    public function updateStatus(Request $request, Order $order)
    {
        // 1. Validate dữ liệu đầu vào (Rất quan trọng)
        $allowedStatuses = [
            'Chờ thanh toán', 
            'Đang xử lý', 
            'Đang giao', 
            'Hoàn thành', 
            'Đã hủy'
        ];
        
        $validated = $request->validate([
            'status' => [
                'required',
                'string',
                Rule::in($allowedStatuses) // Trạng thái mới phải nằm trong danh sách cho phép
            ]
        ]);

        $newStatus = $validated['status'];
        $oldStatus = $order->status;

        // 2. Validate logic nghiệp vụ (Ví dụ)
        // Bạn không thể chuyển một đơn "Hoàn thành" về "Đang xử lý"
        if ($oldStatus == 'Hoàn thành' || $oldStatus == 'Đã hủy') {
            return response()->json([
                'message' => 'Không thể thay đổi trạng thái của đơn hàng đã hoàn thành hoặc đã hủy.'
            ], 400); // 400 Bad Request
        }
        
        // Bạn không thể "Hoàn thành" một đơn chưa "Đang giao"
        if ($newStatus == 'Hoàn thành' && $oldStatus != 'Đang giao') {
             return response()->json([
                'message' => 'Chỉ có thể hoàn thành đơn hàng đang ở trạng thái "Đang giao".'
            ], 400);
        }

        // 3. Cập nhật vào Database
        $order->status = $newStatus;
        $order->save();

        // 4. (NÂNG CAO) Xử lý các tác vụ phụ (Side Effects)
        // Đây là nơi bạn tích hợp các logic khác
        if ($newStatus == 'Đang giao' && $oldStatus != 'Đang giao') {
            // GỌI API GIAO HÀNG (ví dụ: GHTK, Viettel Post...)
            // GỬI EMAIL cho khách hàng (kèm mã tracking)
        }
        
        if ($newStatus == 'Đã hủy' && $oldStatus != 'Đã hủy') {
            // HOÀN TRẢ SỐ LƯỢNG SẢN PHẨM VÀO KHO
            // GỬI EMAIL thông báo hủy đơn
        }

        // 5. Trả về đơn hàng đã được cập nhật
        return response()->json($order);
    }

    public function show(Order $order)
    {
        // 'load' để nạp quan hệ 'items' vào object $order
        // Chúng ta cũng load 'customer' để có thông tin user nếu có
        $order->load('items', 'customer');

        return response()->json($order);
    }
}