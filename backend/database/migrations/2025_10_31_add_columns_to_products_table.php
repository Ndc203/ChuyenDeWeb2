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
            // Kiểm tra và thêm cột slug nếu chưa có
            if (!Schema::hasColumn('products', 'slug')) {
                $table->string('slug')->unique()->after('name');
            }
            
            // Kiểm tra và thêm cột discount nếu chưa có
            if (!Schema::hasColumn('products', 'discount')) {
                $table->integer('discount')->default(0)->comment('Discount percentage')->after('price');
            }
            
            // Kiểm tra và thêm cột status nếu chưa có
            if (!Schema::hasColumn('products', 'status')) {
                $table->enum('status', ['active', 'inactive'])->default('active')->after('image');
            }
            
            // Kiểm tra và thêm cột deleted_at nếu chưa có (soft deletes)
            if (!Schema::hasColumn('products', 'deleted_at')) {
                $table->softDeletes()->after('updated_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'slug')) {
                $table->dropColumn('slug');
            }
            if (Schema::hasColumn('products', 'discount')) {
                $table->dropColumn('discount');
            }
            if (Schema::hasColumn('products', 'status')) {
                $table->dropColumn('status');
            }
            if (Schema::hasColumn('products', 'deleted_at')) {
                $table->dropColumn('deleted_at');
            }
        });
    }
};

