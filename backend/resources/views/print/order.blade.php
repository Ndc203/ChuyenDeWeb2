<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Hóa đơn #{{ $order->order_id }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }
        .invoice-container {
            width: 100%;
            margin: 0 auto;
        }
        
        /* --- SỬA CSS BẢNG HEADER --- */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .header-table td {
            border: none; /* Không kẻ khung cho header */
            padding: 0;
            vertical-align: top;
        }
        .header-left {
            width: 60%;
            text-align: left;
        }
        .header-right {
            width: 40%;
            text-align: right;
        }
        /* --------------------------- */

        h1 {
            margin: 0 0 10px 0;
            font-size: 20px;
            color: #000;
            text-transform: uppercase;
        }

        /* CSS cho bảng sản phẩm */
        .product-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .product-table th, .product-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .product-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }

        .text-right {
            text-align: right;
        }
        
        .totals {
            width: 40%;
            margin-left: auto;
        }
        .totals td {
            border: none;
            padding: 5px 0;
        }
        .total-row td {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #333;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #777;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        
        <table class="header-table">
            <tr>
                <td class="header-left">
                    <h1>HÓA ĐƠN</h1>
                    <p style="margin: 2px 0;">Mã đơn hàng: <strong>#{{ $order->order_id }}</strong></p>
                    <p style="margin: 2px 0;">Ngày đặt: {{ $order->created_at ? $order->created_at->format('d/m/Y H:i') : '' }}</p>
                    <p style="margin: 2px 0;">Trạng thái: {{ $order->status }}</p>
                </td>
                <td class="header-right">
                    <strong>Techshop nhóm B</strong><br>
                    123 Đường ABC, Quận 1<br>
                    TP. Hồ Chí Minh<br>
                    (028) 1234 5678
                </td>
            </tr>
        </table>
        <div style="margin-bottom: 20px;">
            <strong>Thông tin khách hàng:</strong>
            <div style="margin-top: 5px;">
                Tên: {{ $order->customer_name }}<br>
                Email: {{ $order->customer_email }}<br>
                SĐT: {{ $order->customer_phone }}<br>
                Địa chỉ: {{ $order->shipping_address }}
            </div>
        </div>

        <table class="product-table">
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
                    <td>Tổng phụ</td>
                    <td class="text-right">{{ number_format($subtotal, 0, ',', '.') }} đ</td>
                </tr>
                <tr>
                    <td>Giảm giá ({{ $order->coupon_code ?? 'None' }})</td>
                    <td class="text-right">- {{ number_format($order->discount_amount, 0, ',', '.') }} đ</td>
                </tr>
                <tr class="total-row">
                    <td>Tổng cộng</td>
                    <td class="text-right">{{ number_format($order->final_amount, 0, ',', '.') }} đ</td>
                </tr>
            </tbody>
        </table>

        <div class="footer">
            <p>Cảm ơn quý khách đã mua hàng!</p>
        </div>
    </div>
</body>
</html>