<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    use HasFactory;

    protected $fillable = [
        'post_id',
        'user_id',
        'content',
    ];

    // ✅ Mỗi comment thuộc về 1 bài viết
    public function post()
    {
        return $this->belongsTo(Post::class, 'post_id');
    }

    // ✅ Mỗi comment thuộc về 1 người dùng
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
