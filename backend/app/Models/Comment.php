<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    // Tên bảng
    protected $table = 'comments';

    // Khóa chính
    protected $primaryKey = 'comment_id';

    // Cho phép gán hàng loạt
    protected $fillable = [
        'post_id',
        'user_id',
        'content',
    ];

    // Timestamps
    public $timestamps = true;

    // ✅ Mỗi comment thuộc về 1 bài viết
    public function post()
    {
        return $this->belongsTo(Post::class, 'post_id', 'post_id');
    }

    // ✅ Mỗi comment thuộc về 1 người dùng
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
