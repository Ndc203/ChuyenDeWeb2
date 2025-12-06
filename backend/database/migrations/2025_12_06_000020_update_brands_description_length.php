<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // Nâng giới hạn mô tả thương hiệu lên 1000 ký tự để khớp validation/frontend
        DB::statement('ALTER TABLE brands MODIFY description VARCHAR(1000) NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE brands MODIFY description VARCHAR(255) NULL');
    }
};
