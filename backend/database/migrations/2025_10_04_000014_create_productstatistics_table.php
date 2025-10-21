<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductstatisticsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('productstatistics', function (Blueprint $table) {
            // Khóa chính
            $table->increments('stat_id');

            // Khóa ngoại: KHỚP với products.product_id (UNSIGNED INT)
            $table->unsignedInteger('product_id')->nullable();

            $table->integer('sold_count')->default(0);
            $table->unsignedTinyInteger('month')->nullable();
            $table->unsignedSmallInteger('year')->nullable();

            // Foreign key đúng tên cột và kiểu
            $table->foreign('product_id')
                  ->references('product_id')->on('products')
                  ->cascadeOnDelete();

            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('productstatistics');
    }
}
