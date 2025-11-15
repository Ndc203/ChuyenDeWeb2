<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCartitemsTable extends Migration
{
    public function up()
    {
        Schema::create('cartitems', function (Blueprint $table) {
            $table->id('cartitem_id');
            $table->foreignId('cart_id')
                ->constrained(
                    table: 'carts',    // Tên bảng tham chiếu
                    column: 'cart_id' // Tên cột tham chiếu
                )
                ->cascadeOnDelete();
            $table->foreignId('product_id')
                ->constrained(
                    table: 'products',    // Tên bảng tham chiếu
                    column: 'product_id' // Tên cột tham chiếu
                )
                ->cascadeOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('price', 10, 2)->nullable();

        });
    }

    public function down()
    {
        Schema::dropIfExists('cartitems');
    }
}
