<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cart extends Model
{
    use HasFactory;
    
    protected $primaryKey = 'cart_id';
    protected $fillable = ['user_id'];

    // Một giỏ hàng có nhiều 'items'
    public function items()
    {
        return $this->hasMany(CartItem::class, 'cart_id', 'cart_id');
    }

    // Một giỏ hàng thuộc về 1 User
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}