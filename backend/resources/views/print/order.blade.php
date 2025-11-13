<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hóa đơn #{{ $order->order_id }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Be Vietnam Pro', 'Arial', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .invoice-container {
            width: 800px;
            margin: 20px auto;
            padding: 30px;
            border: 1px solid #eee;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #000;
        }
        .header .company-details {
            text-align: right;
        }
        .customer-details {
            margin-bottom: 30px;
        }
        .customer-details strong {
            display: block;
            margin-bottom: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table th, table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        table th {
            background-color: #f9f9f9;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            width: 50%;
            margin-left: auto;
        }
        .totals td {
            border: none;
            padding: 5px 0;
        }
        .totals .total-row td {
            font-weight: bold;
            font-size: 1.2em;
            border-top: 2px solid #333;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
        
        /* CSS cho bản in */
        @media print {
            body {
                print-color-adjust: exact; /* Chuẩn (browsers hỗ trợ thuộc tính chuẩn) */
                -webkit-print-color-adjust: exact; /* Đảm bảo màu nền được in (Chrome) */
            }
            .invoice-container {
                width: 100%;
                margin: 0;
                padding: 0;
                border: none;
                box-shadow: none;
            }
            .no-print {
                display: none; /* Ẩn các nút khi in */
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div>
                <h1>HÓA ĐƠN</h1>
                <p>Mã đơn hàng: <strong>#{{ $order->order_id }}</strong></p>
                <p>Ngày đặt: {{ $order->created_at->format('d/m/Y H:i') }}</p>
                <p>Trạng thái: <strong>{{ $order->status }}</strong></p>
            </div>
            <div class="company-details">
                <strong>Tên Shop Của Bạn</strong><br>
                123 Đường ABC, Quận 1<br>
                TP. Hồ Chí Minh<br>
                (028) 1234 5678
            </div>
        </div>

        <div class="customer-details">
            <strong>Thông tin khách hàng:</strong>
            <p>
                {{ $order->customer_name }}<br>
                {{ $order->customer_email }}<br>
                {{ $order->customer_phone }}<br>
                {{ $order->shipping_address }}
            </p>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Sản phẩm</th>
                    <th class="text-right">Số lượng</th>
                    <th class="text-right">Đơn giá</th>
                    <th class="text-right">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                @foreach($order->items as $item)
                <tr>
                    <td>{{ $item->product_name }}</td>
                    <td class="text-right">{{ $item->quantity }}</td>
                    <td class="text-right">{{ number_format($item->unit_price, 0, ',', '.') }} đ</td>
                    <td class="text-right">{{ number_format($item->unit_price * $item->quantity, 0, ',', '.') }} đ</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <table class="totals">
            <tbody>
                <tr>
                    <td>Tổng phụ (sản phẩm)</td>
                    <td class="text-right">{{ number_format($subtotal, 0, ',', '.') }} đ</td>
                </tr>
                <tr>
                    <td>Giảm giá (Coupon: {{ $order->coupon_code ?? 'N/A' }})</td>
                    <td class="text-right">- {{ number_format($order->discount_amount, 0, ',', '.') }} đ</td>
                </tr>
                <tr>
                    <td>Phí vận chuyển (Giả định)</td>
                    <td class="text-right">0 đ</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Tổng cộng</strong></td>
                    <td class="text-right"><strong>{{ number_format($order->final_amount, 0, ',', '.') }} đ</strong></td>
                </tr>
            </tbody>
        </table>

        <div class="footer">
            <p>Cảm ơn bạn đã mua hàng!</p>
        </div>
    </div>

    <script>
        window.onload = function() {
            window.print();
            
            // Cung cấp một chút thời gian cho cửa sổ in mở ra trước khi đóng
            setTimeout(function() {
                window.close();
            }, 500);
        }
    </script>
</body>
</html>