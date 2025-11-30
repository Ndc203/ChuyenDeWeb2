<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\ValidationRule;

class ValidText implements ValidationRule
{
    /**
     * Validate text input against blank/HTML/full-width number cases.
     */
    public function validate(string $attribute, mixed $value, \Closure $fail): void
    {
        if ($value === null) {
            return;
        }

        if (!is_string($value)) {
            $fail('The :attribute must be a string value.');
            return;
        }

        // Replace 2-byte spaces with normal spaces before trimming.
        $normalized = preg_replace('/\x{3000}/u', ' ', $value);
        if (trim($normalized) === '') {
            $fail('The :attribute cannot be empty or whitespace.');
            return;
        }

        // Reject HTML markup pasted from other sites.
        if (strip_tags($value) !== $value) {
            $fail('The :attribute cannot contain HTML markup.');
            return;
        }

        // Prevent full-width digits that often bypass numeric validation.
        if (preg_match('/[\x{FF10}-\x{FF19}]/u', $value)) {
            $fail('The :attribute must not include full-width digits.');
            return;
        }

        // Guard against excessively long pasted content.
        if (mb_strlen($value) > 5000) {
            $fail('The :attribute may not be greater than 5000 characters.');
        }
    }
}
