<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductHistory extends Model
{
    protected $table = 'product_history';
    // Đúng tên khóa chính của bảng
    protected $primaryKey = 'product_history_id';
    public $timestamps = false; // Chỉ có created_at, không có updated_at

    protected $fillable = [
        'product_id',
        'user_id',
        'action',
        'old_values',
        'new_values',
        'changed_fields',
        'description',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'changed_fields' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Quan hệ với Product
     */
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    /**
     * Quan hệ với User (người thực hiện thay đổi)
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    /**
     * Tạo bản ghi lịch sử
     */
    public static function logChange(Product $product, $action, $oldValues = [], $newValues = [], $user = null)
    {
        $changedFields = [];
        
        if ($action === 'updated') {
            // Xác định các trường đã thay đổi
            foreach ($newValues as $key => $newValue) {
                if (isset($oldValues[$key]) && $oldValues[$key] != $newValue) {
                    $changedFields[] = $key;
                }
            }
        }

        // Tạo mô tả chi tiết
        $description = self::generateDescription($action, $changedFields, $oldValues, $newValues);

        return self::create([
            'product_id' => $product->product_id,
            'user_id' => $user?->user_id ?? auth()->id(),
            'action' => $action,
            'old_values' => empty($oldValues) ? null : $oldValues,
            'new_values' => empty($newValues) ? null : $newValues,
            'changed_fields' => empty($changedFields) ? null : $changedFields,
            'description' => $description,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }

    /**
     * Tạo mô tả chi tiết cho thay đổi
     */
    private static function generateDescription($action, $changedFields, $oldValues, $newValues)
    {
        $descriptions = [];

        switch ($action) {
            case 'created':
                return 'Sản phẩm được tạo mới';
            case 'deleted':
                return 'Sản phẩm bị xóa';
            case 'restored':
                return 'Sản phẩm được khôi phục';
            case 'updated':
                foreach ($changedFields as $field) {
                    $oldValue = $oldValues[$field] ?? 'N/A';
                    $newValue = $newValues[$field] ?? 'N/A';
                    
                    $fieldName = self::getFieldDisplayName($field);
                    $descriptions[] = "{$fieldName}: '{$oldValue}' → '{$newValue}'";
                }
                return implode(', ', $descriptions);
            default:
                return 'Hành động không xác định';
        }
    }

    /**
     * Lấy tên hiển thị của trường
     */
    private static function getFieldDisplayName($field)
    {
        $fieldNames = [
            'name' => 'Tên sản phẩm',
            'slug' => 'Slug',
            'description' => 'Mô tả',
            'price' => 'Giá',
            'discount' => 'Giảm giá',
            'stock' => 'Tồn kho',
            'category_id' => 'Danh mục',
            'brand_id' => 'Thương hiệu',
            'is_flash_sale' => 'Flash Sale',
            'is_new' => 'Sản phẩm mới',
            'tags' => 'Tags',
            'image' => 'Hình ảnh',
            'status' => 'Trạng thái',
        ];

        return $fieldNames[$field] ?? $field;
    }
}
