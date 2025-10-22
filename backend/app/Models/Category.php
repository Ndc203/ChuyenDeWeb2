<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    // Tên bảng trong DB
    protected $table = 'categories';

    // Khóa chính
    protected $primaryKey = 'category_id';

    // Nếu bảng không có created_at, updated_at của Laravel
    public $timestamps = false;

    // Cho phép ghi các trường này khi create/update
    protected $fillable = [
        'name',
        'description',
        'parent_id',
        'created_at',
    ];

    // Kiểu dữ liệu cho các trường
    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * Lấy danh mục cha
     */
    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id', 'category_id');
    }

    /**
     * Lấy danh sách danh mục con
     */
    public function children()
    {
        return $this->hasMany(self::class, 'parent_id', 'category_id');
    }
}
