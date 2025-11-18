<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    use HasFactory;
    
    protected $primaryKey = 'cartitem_id';
    protected $fillable = ['cart_id', 'product_id', 'quantity'];

    // Một item thuộc về 1 giỏ hàng
    public function cart()
    {
        return $this->belongsTo(Cart::class, 'cart_id', 'cart_id');
    }

    /**
     * THÊM QUAN HỆ NÀY:
     * Lấy thông tin sản phẩm (tên, giá, ảnh)
     */
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}