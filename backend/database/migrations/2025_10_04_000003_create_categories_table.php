<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCategoriesTable extends Migration
{
    public function up()
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->increments('category_id');
            $table->string('name');
            $table->string('description')->nullable();
            $table->integer('parent_id')->nullable()->unsigned();

            // ✅ Thêm cột trạng thái ngay sau parent_id
            $table->enum('status', ['active', 'inactive'])
                  ->default('active')
                  ->comment('Trạng thái hoạt động');

            $table->timestamp('created_at')->useCurrent();

            $table->foreign('parent_id')
                  ->references('category_id')
                  ->on('categories')
                  ->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('categories');
    }
}
