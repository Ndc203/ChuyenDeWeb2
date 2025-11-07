<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    // KHÓA CHÍNH LÀ user_id
    protected $primaryKey = 'user_id';
    public $incrementing = true;
    protected $keyType = 'int';

    /**
y

    /**
     * Các cột được phép mass assignment
     */
    protected $fillable = [
        'username',
        'full_name',
        'avatar',
        'email',
        'password',
        'phone',
        'address',
        'date_of_birth',
        'gender',
        'department',
        'about_me',
        'social_links',
        'status',
        'role',
        'last_login_at',
    ];

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
            'social_links' => 'array',
            'date_of_birth' => 'date',
            'last_login_at' => 'datetime',
        ];
    }
}