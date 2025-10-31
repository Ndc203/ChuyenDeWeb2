<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Xóa cột tags cũ (kiểu SET)
            $table->dropColumn('tags');
        });

        Schema::table('products', function (Blueprint $table) {
            // Thêm lại cột tags mới (kiểu TEXT)
            $table->text('tags')->nullable()->after('is_new');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('tags');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->set('tags', ['hot', 'de-xuat', 'giam-gia'])->nullable()->after('is_new');
        });
    }
};

