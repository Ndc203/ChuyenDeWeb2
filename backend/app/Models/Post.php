<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category_id',
        'title',
        'excerpt',
        'content',
        'image',
        'status',
        'is_trending',
    ];

    public function category()
{
    return $this->belongsTo(PostCategory::class, 'category_id');
}

    public function user()
{
    return $this->belongsTo(User::class, 'user_id', 'user_id');
}
public function getImageUrlAttribute()
{
    return asset('images/posts/' . $this->image);
}

}
