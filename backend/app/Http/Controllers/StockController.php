<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    /**
     * Lấy danh sách tồn kho
     */
    public function index()
    {
        $stocks = Product::with(['category', 'brand'])
            ->select(
                'product_id',
                'name',
                'image',
                'stock',
                'price',
                'updated_at',
                'category_id',
                'brand_id'
            )
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($product) {
                // Tính tồn kho tối thiểu (10% của giá hoặc tối thiểu 5)
                $minStock = max(5, (int)($product->price / 1000000));

                // Xác định trạng thái
                if ($product->stock == 0) {
                    $status = 'Hết hàng';
                    $statusColor = 'red';
                } elseif ($product->stock <= $minStock) {
                    $status = 'Sắp hết';
                    $statusColor = 'yellow';
                } else {
                    $status = 'Còn hàng';
                    $statusColor = 'green';
                }

                return [
                    'id' => $product->product_id,
                    'hashed_id' => $product->hashed_id, // Add hashed_id support
                    'name' => $product->name,
                    'image' => $product->image,
                    'brand' => optional($product->brand)->name,
                    'category' => optional($product->category)->name,
                    'current_stock' => $product->stock,
                    'min_stock' => $minStock,
                    'status' => $status,
                    'status_color' => $statusColor,
                    'last_updated' => $product->updated_at->format('d/m/Y'),
                ];
            });

        return response()->json($stocks);
    }

    /**
     * Lấy lịch sử nhập/xuất kho
     */
    public function history()
    {
        // Giả lập dữ liệu lịch sử (trong thực tế cần tạo bảng stock_transactions)
        $history = [
            [
                'id' => 1,
                'product_id' => 1,
                'product_name' => 'iPhone 15 Pro Max',
                'type' => 'import',
                'quantity' => 50,
                'date' => '2024-01-15',
                'note' => 'Nhập hàng từ nhà cung cấp Apple',
                'user' => 'Admin',
            ],
            [
                'id' => 2,
                'product_id' => 2,
                'product_name' => 'Samsung Galaxy S24 Ultra',
                'type' => 'export',
                'quantity' => 30,
                'date' => '2024-01-14',
                'note' => 'Xuất hàng cho đơn hàng #12345',
                'user' => 'Admin',
            ],
            [
                'id' => 3,
                'product_id' => 3,
                'product_name' => 'MacBook Pro M3',
                'type' => 'import',
                'quantity' => 20,
                'date' => '2024-01-13',
                'note' => 'Nhập hàng từ nhà cung cấp',
                'user' => 'Admin',
            ],
        ];

        return response()->json($history);
    }

    /**
     * Cập nhật tồn kho (nhập/xuất)
     * Hỗ trợ cả product_id (ID thật) và hashed_id
     */
    public function updateStock(Request $request)
    {
        $request->validate([
            'product_id' => 'required',
            'type' => 'required|in:import,export',
            'quantity' => 'required|integer|min:1',
            'note' => 'nullable|string|max:500',
        ]);

        // Tìm product bằng ID hoặc hashed_id
        $productId = $request->product_id;
        
        // Nếu là số, tìm bằng product_id
        if (is_numeric($productId)) {
            $product = Product::where('product_id', $productId)->firstOrFail();
        } else {
            // Nếu không phải số, decode hashed_id
            $product = Product::findByHashedId($productId);
            if (!$product) {
                return response()->json([
                    'message' => 'Không tìm thấy sản phẩm'
                ], 404);
            }
        }

        DB::beginTransaction();
        try {
            if ($request->type === 'import') {
                // Nhập kho
                $product->stock += $request->quantity;
            } else {
                // Xuất kho
                if ($product->stock < $request->quantity) {
                    return response()->json([
                        'message' => 'Số lượng tồn kho không đủ để xuất'
                    ], 400);
                }
                $product->stock -= $request->quantity;
            }

            $product->save();

            // TODO: Lưu lịch sử vào bảng stock_transactions
            // StockTransaction::create([...]);

            DB::commit();

            return response()->json([
                'message' => $request->type === 'import' ? 'Nhập kho thành công' : 'Xuất kho thành công',
                'product' => $product,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Có lỗi xảy ra: ' . $e->getMessage()
            ], 500);
        }
    }
}
