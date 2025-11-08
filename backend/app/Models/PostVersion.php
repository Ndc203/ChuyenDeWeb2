<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostVersion extends Model
{
    protected $fillable = [
        'post_id',
        'user_id',
        'category_id',
        'title',
        'excerpt',
        'content',
        'image',
        'status',
        'is_trending',
    ];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    public function user()
    {
        // Lưu ý: user_id của bạn là integer tự định nghĩa, nên dùng key user_id
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }
}
