<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostCategory extends Model
{
    use HasFactory;

    protected $table = 'postcategories';
    protected $primaryKey = 'post_category_id';
    public $timestamps = true;

    protected $fillable = [
        'name',
        'description',
    ];

    // ✅ 1 danh mục có nhiều bài viết
    public function posts()
    {
        return $this->hasMany(Post::class, 'post_category_id', 'post_category_id');
    }

    // ✅ 1 danh mục có thể có nhiều phiên bản bài viết
    public function postVersions()
    {
        return $this->hasMany(PostVersion::class, 'post_category_id', 'post_category_id');
    }
}
