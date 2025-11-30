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

    public const SLUG_MAX_LENGTH = 30;

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
        $baseSlug = Str::slug(Str::limit($name, self::SLUG_MAX_LENGTH, '')) ?: 'category';
        $slug = $baseSlug;
        $suffix = 2;

        $ensureLength = function (string $value, string $suffix) {
            $maxLength = self::SLUG_MAX_LENGTH - strlen($suffix);
            if ($maxLength <= 0) {
                return '';
            }
            return Str::limit($value, $maxLength, '');
        };

        while (self::where('slug', $slug)
            ->when($ignoreId, fn($q) => $q->where('category_id', '!=', $ignoreId))
            ->exists()) {
            $suffixStr = "-{$suffix}";
            $trimmed = $ensureLength($baseSlug, $suffixStr);
            $slug = ($trimmed ?: Str::slug('category')) . $suffixStr;
            $suffix++;
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
