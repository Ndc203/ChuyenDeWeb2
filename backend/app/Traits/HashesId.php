<?php

namespace App\Traits;

use Hashids\Hashids;

trait HashesId
{
    /**
     * Encode ID thành hash string
     */
    public function getHashedIdAttribute()
    {
        $hashids = new Hashids(config('app.key'), 10);
        return $hashids->encode($this->getKey());
    }

    /**
     * Decode hash string về ID
     */
    public static function decodeHashedId($hashedId)
    {
        try {
            $hashids = new Hashids(config('app.key'), 10);
            $decoded = $hashids->decode($hashedId);
            return !empty($decoded) ? $decoded[0] : null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Tìm model bằng hashed ID
     */
    public static function findByHashedId($hashedId)
    {
        $id = static::decodeHashedId($hashedId);
        return $id ? static::find($id) : null;
    }

    /**
     * Tìm model bằng hashed ID hoặc fail
     */
    public static function findByHashedIdOrFail($hashedId)
    {
        $id = static::decodeHashedId($hashedId);
        if (!$id) {
            abort(404, 'Resource not found');
        }
        return static::findOrFail($id);
    }
}
