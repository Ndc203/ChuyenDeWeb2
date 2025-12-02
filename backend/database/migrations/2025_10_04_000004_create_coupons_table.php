<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCouponsTable extends Migration
{
    public function up()
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id('coupon_id');
            $table->string('code', 50)->unique();
            $table->text('description')->nullable();
            $table->string('type');
            $table->decimal('value', 15, 2);
            $table->decimal('max_value', 15, 2)->nullable();
            $table->decimal('min_order_value', 15, 2)->default(0);
            $table->unsignedInteger('max_usage')->default(0);
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('coupons');
    }
}