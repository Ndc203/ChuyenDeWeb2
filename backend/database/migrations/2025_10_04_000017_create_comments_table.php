<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id(); // tự động tạo 'id' BIGINT UNSIGNED
            $table->unsignedBigInteger('post_id')->nullable(); // khớp với posts.id (BIGINT)
            $table->unsignedInteger('user_id')->nullable();    // khớp với users.user_id (INT)
            $table->text('content')->nullable();
            $table->timestamps();

            
            $table->foreign('post_id')->references('id')->on('posts')->onDelete('cascade');
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
