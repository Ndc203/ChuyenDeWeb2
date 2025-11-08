<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ApiToken extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'token',
        'permissions',
        'rate_limit',
        'last_used_at',
        'expires_at',
        'is_active',
    ];

    protected $casts = [
        'permissions' => 'array',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    protected $hidden = [
        'token', // Ẩn token khi serialize
    ];

    /**
     * Generate API token
     */
    public static function generateToken(): string
    {
        return hash('sha256', Str::random(40));
    }

    /**
     * Relationship: Token thuộc về user
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    /**
     * Kiểm tra token có hợp lệ không
     */
    public function isValid(): bool
    {
        // Kiểm tra active
        if (!$this->is_active) {
            return false;
        }

        // Kiểm tra hết hạn
        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }

    /**
     * Kiểm tra quyền
     */
    public function hasPermission(string $permission): bool
    {
        if (!$this->permissions) {
            return false;
        }

        // Kiểm tra quyền wildcard (*)
        if (in_array('*', $this->permissions)) {
            return true;
        }

        // Kiểm tra quyền cụ thể
        if (in_array($permission, $this->permissions)) {
            return true;
        }

        // Kiểm tra quyền với wildcard (products.*)
        $parts = explode('.', $permission);
        if (count($parts) === 2) {
            $wildcardPermission = $parts[0] . '.*';
            if (in_array($wildcardPermission, $this->permissions)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Update last used timestamp
     */
    public function updateLastUsed(): void
    {
        $this->last_used_at = now();
        $this->save();
    }

    /**
     * Scope: Chỉ lấy token active
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                    ->where(function ($q) {
                        $q->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                    });
    }
}
