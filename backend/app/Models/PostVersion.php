<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostVersion extends Model
{
    use HasFactory;

    protected $table = 'post_versions';
    protected $primaryKey = 'post_version_id';
    public $timestamps = true;

    protected $fillable = [
        'post_id',
        'user_id',
        'post_category_id',
        'title',
        'excerpt',
        'content',
        'image',
        'status',
        'is_trending',
    ];

    // ✅ Mỗi phiên bản thuộc về 1 bài viết gốc
    public function post()
    {
        return $this->belongsTo(Post::class, 'post_id', 'post_id');
    }

    // ✅ Phiên bản này do 1 người dùng tạo
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    // ✅ Phiên bản này thuộc 1 danh mục
    public function category()
    {
        return $this->belongsTo(PostCategory::class, 'post_category_id', 'post_category_id');
    }
}
