<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrdersTable extends Migration
{
    public function up()
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->increments('order_id');
            $table->unsignedInteger('user_id')->nullable();
            $table->decimal('total', 10, 2)->default(0.00);
            $table->unsignedInteger('coupon_id')->nullable();
            $table->timestamps(0); // created_at only, no updated_at
        });
    }

    public function down()
    {
        Schema::dropIfExists('orders');
    }
}