<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('post_versions', function (Blueprint $table) {
            $table->id();

            // Liên kết tới bài viết gốc
            $table->foreignId('post_id')->constrained('posts')->onDelete('cascade');

            // Người thực hiện (tham chiếu tới users.user_id)
            $table->unsignedInteger('user_id')->nullable();
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('set null');

            // Dữ liệu snapshot (phiên bản cũ)
            $table->foreignId('category_id')->nullable()->constrained('postcategories')->onDelete('set null');
            $table->string('title', 255);
            $table->text('excerpt')->nullable();
            $table->longText('content')->nullable();
            $table->string('image')->nullable();
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->boolean('is_trending')->default(false);

            // Thời điểm lưu phiên bản
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_versions');
    }
};
