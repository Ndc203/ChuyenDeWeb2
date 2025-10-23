<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrderitemsTable extends Migration
{
    public function up()
    {
        Schema::create('orderitems', function (Blueprint $table) {
            $table->increments('order_item_id');
            $table->unsignedInteger('order_id')->nullable();
            $table->unsignedInteger('product_id')->nullable();
            $table->integer('quantity')->default(1);
            $table->decimal('price', 10, 2)->nullable();

            $table->foreign('order_id')->references('order_id')->on('orders')->onDelete('cascade');
            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('orderitems');
    }
}