<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    // Khai báo khóa chính tùy chỉnh
    protected $primaryKey = 'coupon_id';

    protected $fillable = [
        'code',
        'description',
        'type',
        'value',
        'max_value',
        'min_order_value',
        'max_usage',
        'usage_count',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'is_active' => 'boolean',
    ];
}