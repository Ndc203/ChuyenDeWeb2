<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCartitemsTable extends Migration
{
    public function up()
    {
        Schema::create('cartitems', function (Blueprint $table) {
            $table->increments('item_id');
            $table->unsignedInteger('cart_id')->nullable();
            $table->unsignedInteger('product_id')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('price', 10, 2)->nullable();

            $table->foreign('cart_id')->references('cart_id')->on('carts')->onDelete('cascade');
            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('cartitems');
    }
}