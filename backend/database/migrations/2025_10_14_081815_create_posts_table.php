<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
    Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
    $table->foreignId('category_id')->constrained('postcategories')->onDelete('cascade');
    $table->string('title', 255);
    $table->text('excerpt')->nullable();
    $table->longText('content');
    $table->string('image')->nullable();
    $table->enum('status', ['draft', 'published'])->default('draft');
    $table->boolean('is_trending')->default(false);
    $table->timestamps();
});

    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
