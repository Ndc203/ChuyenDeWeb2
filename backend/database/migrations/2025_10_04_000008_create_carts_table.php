<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateCartsTable extends Migration
{
    public function up()
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id('cart_id');
            $table->foreignId('user_id') 
          ->nullable() 
          ->constrained(
              table: 'users', 
              column: 'user_id'
          )
          ->onDelete('set null');
            $table->timestamp('created_at')->useCurrent();

        });
    }

    public function down()
    {
        Schema::dropIfExists('carts');
    }
}