<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'categories';
    protected $primaryKey = 'category_id';
    public $timestamps = true;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'parent_id',
        'status'
    ];

    protected static function booted()
    {
        static::creating(function ($category) {
            $category->slug = static::generateUniqueSlug($category->name);
        });

        static::updating(function ($category) {
            if ($category->isDirty('name')) {
                $category->slug = static::generateUniqueSlug($category->name, $category->category_id);
            }
        });
    }

    public static function generateUniqueSlug($name, $ignoreId = null)
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $count = 2;

        while (self::where('slug', $slug)
            ->when($ignoreId, fn($q) => $q->where('category_id', '!=', $ignoreId))
            ->exists()) {
            $slug = "{$originalSlug}-{$count}";
            $count++;
        }

        return $slug;
    }

    public static function pruneTrashedOlderThanDays(int $days = 30): void
    {
        static::onlyTrashed()
            ->where('deleted_at', '<', now()->subDays($days))
            ->cursor()
            ->each->forceDelete();
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id', 'category_id')->withTrashed();
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id', 'category_id');
    }
}
