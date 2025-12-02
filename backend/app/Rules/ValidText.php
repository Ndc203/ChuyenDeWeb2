<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class ValidText implements Rule
{
    public function passes($attribute, $value)
    {
        if ($value === null) return true;

        // ❌ Chỉ có khoảng trắng (kể cả 2 bytes "　")
        if (trim(str_replace("　", "", $value)) === "") {
            return false;
        }

        // ❌ Full-width number → không hợp lệ với text
        if (preg_match('/[０-９]/u', $value)) {
            return false;
        }

        // ❌ Quá dài (copy html cực lớn từ vnexpress)
        if (mb_strlen($value) > 5000) {
            return false;
        }

        return true;
    }

    public function message()
    {
        return 'Dữ liệu không hợp lệ hoặc chứa ký tự không cho phép.';
    }
}
