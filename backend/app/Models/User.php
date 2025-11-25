<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens, HasRoles;

    // KHÓA CHÍNH LÀ user_id
    protected $primaryKey = 'user_id';

    // SỬA: Xóa các trường profile khỏi $fillable
    protected $fillable = [
        'username',
        'email',
        'password',
        'status',
        'role',
        'last_login_at', // Giữ lại cột này như đã thống nhất
    ];

    /**
     * THÊM QUAN HỆ: Liên kết 1-1 tới UserProfile
     */
    public function profile()
    {
        // 'user_id' (của userprofile) và 'user_id' (của users)
        return $this->hasOne(UserProfile::class, 'user_id', 'user_id');
    }

    /**
     * Ẩn khi trả về JSON
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Cast dữ liệu
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'status' => 'string',
            'role' => 'string',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Quan hệ 1-N với Order
     */
    public function orders() {
        return $this->hasMany(Order::class);
    }


    /**
     * Quan hệ 1-1 với Cart
     */
    public function cart()
    {
        return $this->hasOne(Cart::class, 'user_id', 'user_id');
    }
}