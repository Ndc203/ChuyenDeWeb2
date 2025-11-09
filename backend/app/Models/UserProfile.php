<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    use HasFactory;

    // Chỉ định tên bảng nếu tên model khác tên bảng
    protected $table = 'userprofile';
    
    // Chỉ định khóa chính
    protected $primaryKey = 'profile_id';

    /**
     * Các cột được phép mass assignment
     */
    protected $fillable = [
        'user_id',
        'full_name',
        'avatar',
        'phone',
        'address',
        'date_of_birth',
        'gender',
        'department',
        'about_me',
        'social_links',
    ];

    /**
     * THÊM QUAN HỆ: Liên kết ngược lại với User
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    /**
     * Cast dữ liệu
     */
    protected function casts(): array
    {
        return [
            'social_links' => 'array',
            'date_of_birth' => 'date',
        ];
    }
}