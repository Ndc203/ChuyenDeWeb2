<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $table = 'posts';

    // Quan hệ tới tác giả
    public function author()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    // Quan hệ tới chuyên mục
    public function category()
    {
        return $this->belongsTo(PostCategory::class, 'category_id', 'id');
    }

    // Quan hệ tới bình luận
    public function comments()
    {
        return $this->hasMany(Comment::class, 'post_id', 'id');
    }
}
