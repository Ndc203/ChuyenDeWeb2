<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostCategory extends Model
{
    use HasFactory;

    protected $table = 'postcategories'; // vì không theo chuẩn số nhiều

    protected $fillable = [
        'name',
        'description',
    ];

    // Quan hệ: Một danh mục có nhiều bài viết
    public function posts()
    {
        return $this->hasMany(Post::class, 'category_id');
    }
}
