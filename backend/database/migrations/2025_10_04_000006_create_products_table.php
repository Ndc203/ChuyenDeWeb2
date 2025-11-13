<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductsTable extends Migration
{
    public function up()
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id('product_id');
            $table->foreignId('category_id')
                  ->nullable()
                  ->constrained('categories', 'category_id') // Giả sử PK của categories là 'category_id'
                  ->nullOnDelete();
            $table->foreignId('brand_id')
                  ->nullable()
                  ->constrained('brands', 'brand_id') // Giả sử PK của brands là 'brand_id'
                  ->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->integer('discount')->default(0)->comment('Discount percentage');
            $table->integer('stock')->default(0);
            $table->boolean('is_flash_sale')->default(0);
            $table->boolean('is_new')->default(0);
            $table->text('tags')->nullable();
            $table->string('image')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
}