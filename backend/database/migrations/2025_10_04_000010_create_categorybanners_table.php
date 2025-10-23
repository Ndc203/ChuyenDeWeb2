<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCategorybannersTable extends Migration
{
    public function up()
    {
        Schema::create('categorybanners', function (Blueprint $table) {
            $table->increments('banner_id');
            $table->unsignedInteger('category_id')->nullable();
            $table->string('image')->nullable();
            $table->string('link')->nullable();
            $table->timestamps();
            
            $table->foreign('category_id')->references('category_id')->on('categories')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('categorybanners');
    }
}