<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id('post_id');

            // Khóa ngoại user_id (tham chiếu tới users.user_id)
            // $table->unsignedInteger('user_id')->nullable();
            // $table->foreign('user_id')->references('user_id')->on('users')->onDelete('set null');
            $table->foreignId('user_id') 
          ->nullable() 
          ->constrained(
              table: 'users', 
              column: 'user_id'
          )
          ->onDelete('set null');

            // Khóa ngoại post_category_id
            $table->foreignId('post_category_id')
                  ->constrained(
                      table: 'postcategories',
                      column: 'post_category_id' // Cần chỉ định rõ cột này
                  )
                  ->onDelete('cascade');

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
