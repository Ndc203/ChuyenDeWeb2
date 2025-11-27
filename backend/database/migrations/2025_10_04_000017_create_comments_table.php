<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
    $table->id('comment_id');
    $table->foreignId('post_id')->nullable()
        ->constrained('posts', 'post_id')
        ->onDelete('cascade');

    $table->foreignId('user_id')
        ->constrained('users', 'user_id')
        ->cascadeOnDelete();

    // 🔥 Bình luận cha
    $table->foreignId('parent_id')->nullable()
        ->constrained('comments', 'comment_id') // Tham chiếu chính nó
        ->onDelete('cascade'); // Nếu xóa cha thì con cũng bị xoá

    $table->text('content')->nullable();
    $table->timestamps();
});

    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};