<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrdersTable extends Migration
{
    public function up()
    {
        // Cập nhật file: create_orders_table.php
        Schema::create('orders', function (Blueprint $table) {
            // THAY ĐỔI: Đặt tên ID rõ ràng
            $table->id('order_id');

            // --- Thông tin khách hàng ---
            $table->foreignId('user_id')->nullable()->constrained(
                table: 'users',
                column: 'user_id'
            );
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone')->nullable();
            $table->text('shipping_address')->nullable();

            // --- Thông tin tổng thanh toán ---
            $table->decimal('total_amount', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('final_amount', 15, 2);
            $table->string('coupon_code')->nullable();

            // --- Trạng thái ---
            $table->string('status')->default('Chờ thanh toán');

            $table->timestamps();

            $table->index('status');
            $table->index('customer_email');
        });
    }

    public function down()
    {
        Schema::dropIfExists('orders');
    }
}
