<?php

namespace App\Models;

use App\Traits\HashesId;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory, SoftDeletes, HashesId;

    protected $table = 'products';
    protected $primaryKey = 'product_id';
    public $timestamps = true;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'discount',
        'stock',
        'category_id',
        'brand_id',
        'is_flash_sale',
        'is_new',
        'tags',
        'image',
        'status'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'discount' => 'integer',
        'stock' => 'integer',
        'is_flash_sale' => 'boolean',
        'is_new' => 'boolean',
    ];

    /**
     * Thêm hashed_id vào JSON response
     */
    protected $appends = ['hashed_id'];

    protected static function booted()
    {
        static::creating(function ($product) {
            if (empty($product->slug)) {
                $product->slug = static::generateUniqueSlug($product->name);
            }
        });

        static::updating(function ($product) {
            if ($product->isDirty('name')) {
                $product->slug = static::generateUniqueSlug($product->name, $product->product_id);
            }
        });
    }

    public static function generateUniqueSlug($name, $ignoreId = null)
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $count = 2;

        while (self::where('slug', $slug)
            ->when($ignoreId, fn($q) => $q->where('product_id', '!=', $ignoreId))
            ->exists()) {
            $slug = "{$originalSlug}-{$count}";
            $count++;
        }

        return $slug;
    }

    // Relationships
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'category_id');
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class, 'brand_id', 'brand_id');
    }

    public function reviews()
    {
        return $this->hasMany(ProductReview::class, 'product_id', 'product_id');
    }

    // Accessors
    public function getAverageRatingAttribute()
    {
        return $this->reviews()->avg('rating') ?? 0;
    }

    public function getTotalReviewsAttribute()
    {
        return $this->reviews()->count();
    }

    public function getFinalPriceAttribute()
    {
        if ($this->discount > 0) {
            return $this->price - ($this->price * $this->discount / 100);
        }
        return $this->price;
    }

    public function getBadgesAttribute()
    {
        $badges = [];
        
        if ($this->is_flash_sale) {
            $badges[] = 'SALE';
        }
        
        if ($this->is_new) {
            $badges[] = 'MỚI';
        }
        
        if ($this->tags && str_contains($this->tags, 'hot')) {
            $badges[] = 'HOT';
        }
        
        return $badges;
    }
}
