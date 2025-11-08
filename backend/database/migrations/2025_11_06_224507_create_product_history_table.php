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
        Schema::create('product_history', function (Blueprint $table) {
            $table->id('history_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('user_id')->nullable(); // Người thực hiện thay đổi
            $table->string('action', 50); // 'created', 'updated', 'deleted', 'restored'
            $table->json('old_values')->nullable(); // Giá trị cũ (trước khi thay đổi)
            $table->json('new_values')->nullable(); // Giá trị mới (sau khi thay đổi)
            $table->json('changed_fields')->nullable(); // Danh sách các trường đã thay đổi
            $table->text('description')->nullable(); // Mô tả chi tiết về thay đổi
            $table->string('ip_address', 45)->nullable(); // IP của người thực hiện
            $table->string('user_agent')->nullable(); // Thông tin trình duyệt/thiết bị
            $table->timestamp('created_at')->useCurrent();
            
            // Foreign keys
            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('set null');
            
            // Indexes
            $table->index('product_id');
            $table->index('user_id');
            $table->index('action');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_history');
    }
};
