<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    protected $primaryKey = 'comment_id';

    protected $fillable = ['post_id', 'user_id', 'parent_id', 'content'];

    public function user() {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function replies() {
        return $this->hasMany(Comment::class, 'parent_id', 'comment_id')->with('user', 'replies');
    }
}

