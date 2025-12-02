<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockTransaction extends Model
{
    use HasFactory;

    protected $table = 'stock_transactions';
    protected $primaryKey = 'stock_transaction_id';
    public $timestamps = false; // chỉ dùng created_at

    protected $fillable = [
        'product_id',
        'user_id',
        'type',
        'quantity',
        'note',
        'created_at',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'created_at' => 'datetime',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
