<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $table = 'posts';
    protected $primaryKey = 'post_id';

    protected $fillable = [
        'user_id',
        'post_category_id',
        'title',
        'excerpt',
        'content',
        'image',
        'status',
        'is_trending',
    ];

    public $timestamps = true;

    // ✅ 1 bài viết có nhiều bình luận
    public function comments()
    {
        return $this->hasMany(Comment::class, 'post_id', 'post_id');
    }


public function getImageUrlAttribute()
{
    return asset('images/posts/' . $this->image);
}
// Mỗi bài viết thuộc 1 danh mục
public function category()
{
    return $this->belongsTo(PostCategory::class, 'post_category_id', 'post_category_id');
}

// Mỗi bài viết có nhiều phiên bản
public function versions()
{
    return $this->hasMany(PostVersion::class, 'post_id', 'post_id');
}

}
