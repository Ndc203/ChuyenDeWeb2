<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;
    protected $primaryKey = 'order_id';
    protected $fillable = [
        'user_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'shipping_address',
        'total_amount',
        'discount_amount',
        'final_amount',
        'coupon_code',
        'status',
    ];
    // Quan hệ: Một đơn hàng (Order) có nhiều mục (OrderItem)
    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id', 'order_id');
    }
    
    // Quan hệ: Một đơn hàng (Order) thuộc về một người dùng (User)
    // (nếu user_id không null)
    public function customer()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    
}