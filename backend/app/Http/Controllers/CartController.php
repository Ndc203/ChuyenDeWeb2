<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CartItem; // <-- Thêm
use Illuminate\Support\Facades\Auth; // <-- Thêm

class CartController extends Controller
{
    // Lấy giỏ hàng (hoặc tạo mới nếu chưa có)
    private function getCart()
    {
        $user = Auth::user();
        // firstOrCreate: Tìm giỏ hàng của user, nếu chưa có thì tạo mới
        return $user->cart()->firstOrCreate(['user_id' => $user->user_id]);
    }

    /**
     * API: GET /api/cart
     * Lấy tất cả sản phẩm trong giỏ hàng
     */
    public function index()
    {
        $cart = $this->getCart();
        
        // 'with('product')' sẽ lấy kèm thông tin (tên, giá, ảnh) từ bảng Products
        $items = $cart->items()->with('product')->get();
        
        return response()->json($items);
    }

    /**
     * API: POST /api/cart/add
     * Thêm sản phẩm vào giỏ hàng
     */
    public function add(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,product_id',
            'quantity' => 'required|integer|min:1'
        ]);
        
        $cart = $this->getCart();
        
        // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        $existingItem = $cart->items()->where('product_id', $request->product_id)->first();
        
        if ($existingItem) {
            // Nếu đã có, chỉ tăng số lượng
            $existingItem->increment('quantity', $request->quantity);
        } else {
            // Nếu chưa có, tạo item mới
            $cart->items()->create([
                'product_id' => $request->product_id,
                'quantity' => $request->quantity
            ]);
        }
        
        return response()->json(['message' => 'Sản phẩm đã được thêm vào giỏ hàng!']);
    }

    /**
     * API: PUT /api/cart/items/{cartitem_id}
     * Cập nhật số lượng
     */
    public function update(Request $request, CartItem $item)
    {
        // Bảo mật: Đảm bảo item này thuộc giỏ hàng của user đang đăng nhập
        if ($item->cart->user_id !== Auth::id()) {
            return response()->json(['message' => 'Không được phép!'], 403);
        }
        
        $request->validate([
            'quantity' => 'required|integer|min:1'
        ]);
        
        $item->update(['quantity' => $request->quantity]);
        
        return response()->json($item->load('product')); // Trả về item đã cập nhật
    }

    /**
     * API: DELETE /api/cart/items/{cartitem_id}
     * Xóa sản phẩm khỏi giỏ hàng
     */
    public function remove(CartItem $item)
    {
        // Bảo mật: (Tương tự trên)
        if ($item->cart->user_id !== Auth::id()) {
            return response()->json(['message' => 'Không được phép!'], 403);
        }
        
        $item->delete();
        
        return response()->json(['message' => 'Đã xóa sản phẩm khỏi giỏ hàng!']);
    }
}