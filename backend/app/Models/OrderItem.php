<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{

    protected $primaryKey = 'order_item_id';
    protected $fillable = [
        'order_id',
        'product_id',
        'product_name', // Snapshot tên sản phẩm
        'quantity',
        'unit_price',   // Snapshot giá sản phẩm
    ];
    
    // Quan hệ: Một mục (OrderItem) thuộc về một đơn hàng (Order)
    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'order_id');
    }
    
    // Quan hệ: Một mục (OrderItem) thuộc về một sản phẩm (Product)
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}