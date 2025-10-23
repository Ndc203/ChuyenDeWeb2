<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCategorybannersTable extends Migration
{
    public function up()
    {
        Schema::create('categorybanners', function (Blueprint $table) {
            $table->id('banner_id');
            $table->foreignId('category_id')
                ->nullable()
                ->constrained('categories', 'category_id')
                ->cascadeOnDelete();
            $table->string('image')->nullable();
            $table->string('link')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('categorybanners');
    }
}
