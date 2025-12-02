<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductReviewsTable extends Migration
{
    public function up()
    {
        Schema::create('productreviews', function (Blueprint $table) {
            $table->id('product_review_id'); // Đây là BIGINT (Tốt)

            // SỬA: Đổi 'product_id' từ INT (unsignedInteger) sang BIGINT (foreignId)
            $table->foreignId('product_id')
                  ->nullable()
                  ->constrained(
                      table: 'products',
                      column: 'product_id'
                  )
                  ->nullOnDelete(); // Dùng nullOnDelete hoặc cascadeOnDelete tùy bạn

            // SỬA: Đổi 'user_id' từ INT (unsignedInteger) sang BIGINT (foreignId)
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained(
                      table: 'users',
                      column: 'user_id'
                  )
                  ->nullOnDelete(); // Dùng nullOnDelete hoặc cascadeOnDelete tùy bạn

            $table->tinyInteger('rating')->nullable()->check('rating between 1 and 5');
            $table->text('comment')->nullable();
            
            // GỘP TỪ FILE '..._add_status...':
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->integer('helpful_count')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productreviews');
    }
}