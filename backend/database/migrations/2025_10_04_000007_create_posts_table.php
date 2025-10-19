<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePostsTable extends Migration
{
    public function up()
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->increments('post_id');
            $table->unsignedInteger('user_id')->nullable();
            $table->unsignedInteger('category_id')->nullable();
            $table->string('title');
            $table->text('content')->nullable();
            $table->string('image')->nullable();
            $table->boolean('is_trending')->default(0);
            $table->timestamps(); // This will create created_at and updated_at columns
        });
    }

    public function down()
    {
        Schema::dropIfExists('posts');
    }
}