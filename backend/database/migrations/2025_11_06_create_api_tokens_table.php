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
        Schema::create('api_tokens', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('name'); // Tên token để dễ quản lý
            $table->string('token', 64)->unique(); // API token
            $table->json('permissions')->nullable(); // Quyền: products.read, products.write, products.delete
            $table->integer('rate_limit')->default(60); // Số request/phút
            $table->timestamp('last_used_at')->nullable(); // Lần sử dụng cuối
            $table->timestamp('expires_at')->nullable(); // Ngày hết hạn
            $table->boolean('is_active')->default(true); // Trạng thái active
            $table->timestamps();
            
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
            $table->index('token');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_tokens');
    }
};
