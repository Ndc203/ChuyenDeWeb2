<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\CartItem;
use App\Models\OrderItem;

class OrderController extends Controller
{
    /**
     * API: GET /api/orders
     * Lấy danh sách đơn hàng có phân trang, lọc và tìm kiếm.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Order::query();

        // --- 1. PHÂN QUYỀN (QUAN TRỌNG NHẤT) ---
        // Nếu KHÔNG PHẢI là 'Admin' hoặc 'Staff', thì chỉ được xem đơn của chính mình
        // (Lưu ý: Tên Role phải khớp với Database của bạn, ví dụ: 'Admin', 'admin', 'Staff'...)
        if (!$user->hasRole(['Admin', 'admin', 'Staff', 'staff'])) {
            $query->where('user_id', $user->user_id);
        }

        // --- 2. Eager Loading (Nạp dữ liệu cần thiết) ---
        // - 'items.product': Để lấy ảnh và tên sản phẩm hiển thị ra list
        // - 'customer.profile': Để Admin xem ai mua
        $query->with(['items.product', 'customer.profile'])
              ->withCount('items as item_count');

        // --- 3. Lọc theo trạng thái ---
        if ($request->filled('status') && $request->status != 'all') {
            $query->where('status', $request->status);
        }

        // --- 4. Tìm kiếm (Giữ nguyên logic cũ của bạn) ---
        if ($request->filled('search')) {
            $search = $request->search;
            
            $query->where(function ($q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_email', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($subQ) use ($search) {
                      $subQ->where('username', 'like', "%{$search}%")
                           ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhereHas('customer.profile', function ($subQ) use ($search) {
                      $subQ->where('full_name', 'like', "%{$search}%");
                  });
            });
        }

        // --- 5. Sắp xếp & Phân trang ---
        // Mới nhất lên đầu
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

    public function print(Order $order)
    {
        // 1. Tải tất cả dữ liệu cần thiết cho hóa đơn
        $order->load('items', 'customer.profile');
        
        // 2. Tính toán tổng phụ (giá trị thực của sản phẩm)
        $subtotal = $order->items->sum(function ($item) {
            return $item->unit_price * $item->quantity;
        });

        // 3. Trả về file view 'print.order' và truyền dữ liệu
        return view('print.order', [
            'order' => $order,
            'subtotal' => $subtotal,
        ]);
    }

    /**
     * API: POST /api/orders
     * Tạo đơn hàng mới
     */
    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string',
            'customer_phone' => 'required|string',
            'shipping_address' => 'required|string',
            'payment_method' => 'required|string', // 'cod', 'banking'
            'items' => 'required|array|min:1', // Danh sách sản phẩm từ giỏ
            'total_amount' => 'required|numeric',
            'discount_amount' => 'required|numeric',
            'final_amount' => 'required|numeric',
        ]);

        try {
            DB::beginTransaction();

            $user = Auth::user();

            // 1. Tạo Đơn hàng (Orders Table)
            $order = Order::create([
                'user_id' => $user->user_id,
                'customer_name' => $request->customer_name,
                'customer_email' => $user->email, // Hoặc lấy từ request nếu cho sửa
                'customer_phone' => $request->customer_phone,
                'shipping_address' => $request->shipping_address,
                'total_amount' => $request->total_amount,
                'discount_amount' => $request->discount_amount,
                'final_amount' => $request->final_amount,
                'coupon_code' => $request->coupon_code, // Có thể null
                'status' => 'Chờ thanh toán', // Trạng thái mặc định
                'payment_method' => $request->payment_method,
            ]);

            // 2. Tạo Chi tiết đơn hàng (OrderItems Table)
            foreach ($request->items as $item) {
                OrderItem::create([
                    'order_id' => $order->order_id,
                    'product_id' => $item['product_id'],
                    'product_name' => $item['product']['name'], // Lưu cứng tên lúc mua
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['product']['price'], // Lưu cứng giá lúc mua
                ]);

                // (Tùy chọn) Trừ tồn kho sản phẩm ở đây nếu muốn
            }

            // 3. Xóa các sản phẩm đã mua khỏi Giỏ hàng (Carts)
            // Lấy danh sách ID của cart_items đã mua
            $cartItemIds = array_column($request->items, 'cartitem_id');
            CartItem::whereIn('cartitem_id', $cartItemIds)->delete();

            DB::commit();

            return response()->json([
                'message' => 'Đặt hàng thành công!',
                'order_id' => $order->order_id
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi tạo đơn hàng', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * API: GET /api/orders/{order}/status
     * Dùng để Frontend polling (hỏi thăm) trạng thái
     */
    public function checkStatus($id)
    {
        $order = \App\Models\Order::find($id);
        
        if (!$order) {
            return response()->json(['status' => 'not_found'], 404);
        }

        return response()->json([
            'status' => $order->status, // Trả về: 'Chờ thanh toán', 'Đang xử lý', ...
            'payment_method' => $order->payment_method
        ]);
    }
}