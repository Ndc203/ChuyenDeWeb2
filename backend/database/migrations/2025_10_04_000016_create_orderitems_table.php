<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrderitemsTable extends Migration
{
    public function up()
    {
        Schema::create('order_items', function (Blueprint $table) {
    $table->id('order_item_id');
    
    // Kết nối tới bảng 'orders'
    // 'cascadeOnDelete' nghĩa là nếu xóa đơn hàng -> xóa tất cả item của nó
    $table->foreignId('order_id')
          ->constrained(
              table: 'orders', // Tên bảng
              column: 'order_id' // Tên cột khóa chính của bảng 'orders'
          )
          ->cascadeOnDelete();
    
    // Kết nối tới bảng 'products'
    // 'nullOnDelete' nghĩa là nếu xóa sản phẩm -> cột này thành NULL
    // nhưng item vẫn còn trong lịch sử đơn hàng
    $table->foreignId('product_id')->nullable()->constrained(table: 'products', column: 'product_id')->nullOnDelete();
    
    // --- "Snapshot" thông tin sản phẩm tại thời điểm mua ---
    // Rất quan trọng! Kể cả khi sản phẩm gốc thay đổi giá/tên,
    // thông tin trong đơn hàng không được thay đổi.
    $table->string('product_name');
    $table->integer('quantity');
    $table->decimal('unit_price', 15, 2); // Giá của 1 sản phẩm tại lúc mua

    $table->timestamps();
});
    }

    public function down()
    {
        Schema::dropIfExists('orderitems');
    }
}