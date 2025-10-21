<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePostcommentsTable extends Migration
{
    public function up()
    {
        Schema::create('postcomments', function (Blueprint $table) {
            $table->increments('comment_id');
            $table->unsignedInteger('post_id')->nullable();
            $table->unsignedInteger('user_id')->nullable();
            $table->text('content')->nullable();
            $table->timestamps();
            
            $table->foreign('post_id')->references('post_id')->on('posts')->onDelete('cascade');
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('postcomments');
    }
}