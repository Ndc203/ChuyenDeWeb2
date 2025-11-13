<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id('comment_id'); // tự động tạo 'id' BIGINT UNSIGNED
            $table->foreignId('post_id')
                ->nullable()
                ->constrained(
                    table: 'posts',
                    column: 'post_id' // PK của bảng posts
                )
                ->onDelete('cascade');
            $table->foreignId('user_id')
                ->constrained(
                    table: 'users',    // Tên bảng tham chiếu
                    column: 'user_id' // Tên cột tham chiếu
                )
                ->cascadeOnDelete();
            $table->text('content')->nullable();
            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
