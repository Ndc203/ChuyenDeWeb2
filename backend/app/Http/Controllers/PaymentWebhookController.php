<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    public function handleCasso(Request $request)
    {
        // 1. Log dữ liệu để debug (xem Casso gửi gì qua)
        Log::info('Casso Webhook:', $request->all());

        // 2. Kiểm tra bảo mật (Header Secure-Token mà bạn cài trên Casso)
        // if ($request->header('secure-token') !== env('CASSO_SECURE_TOKEN')) {
        //     return response()->json(['error' => 'Unauthorized'], 401);
        // }

        // 3. Lấy dữ liệu giao dịch (Casso gửi mảng các giao dịch)
        $transactions = $request->input('data'); // Mảng các giao dịch

        if (!$transactions) {
            return response()->json(['message' => 'No data'], 200);
        }

        foreach ($transactions as $trans) {
            // Nội dung ck: "THANHTOAN DONHANG 102"
            $description = $trans['description']; 
            $amount = $trans['amount']; // Số tiền thực nhận

            // 4. Phân tích nội dung để tìm Mã Đơn Hàng
            // Dùng Regex để tìm số sau chữ "DONHANG"
            preg_match('/DONHANG\s*(\d+)/i', $description, $matches);
            
            if (isset($matches[1])) {
                $orderId = $matches[1];
                
                // 5. Tìm đơn hàng trong Database
                $order = Order::find($orderId);

                if ($order && $order->status == 'Chờ thanh toán') {
                    // 6. Kiểm tra số tiền (quan trọng!)
                    // Cho phép sai số nhỏ hoặc bắt buộc chính xác
                    if ($amount >= $order->final_amount) {
                        
                        // CẬP NHẬT TRẠNG THÁI
                        $order->status = 'Đang xử lý'; // Hoặc 'Đã thanh toán'
                        $order->save();

                        Log::info("Đơn hàng #$orderId đã được thanh toán tự động qua Casso.");
                    } else {
                        Log::warning("Đơn hàng #$orderId chuyển thiếu tiền. Nhận: $amount, Cần: $order->final_amount");
                    }
                }
            }
        }

        // Luôn trả về success để Casso không gửi lại
        return response()->json(['error' => 0, 'message' => 'Success']);
    }
}