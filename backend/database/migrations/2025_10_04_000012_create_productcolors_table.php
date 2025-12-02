<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateProductcolorsTable extends Migration
{
    public function up()
    {
        Schema::create('productcolors', function (Blueprint $table) {
            // Khóa chính kiểu INT (khớp phong cách với products dùng increments)
            $table->id('color_id');

            // KHỚP HOÀN TOÀN với products.product_id (UNSIGNED INT)
            $table->foreignId('product_id')
          ->constrained(
              table: 'products',    // Tên bảng tham chiếu
              column: 'product_id' // Tên cột tham chiếu
          )
          ->cascadeOnDelete(); // Tương đương 'on delete cascade'

            $table->string('color_name', 50)->nullable();
            $table->string('hex_code', 10)->nullable();

            // Nếu bạn muốn có created_at/updated_at thì mở dòng dưới:
            // $table->timestamps();

            // Ràng buộc FK đúng cột và kiểu
            // $table->foreignId('product_id')
            //       ->references('product_id')->on('products')
            //       ->cascadeOnDelete();

            $table->index('product_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('productcolors');
    }
}
