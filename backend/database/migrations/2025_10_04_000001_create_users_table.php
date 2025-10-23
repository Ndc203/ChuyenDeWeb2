<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUsersTable extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->increments('user_id');
            $table->string('username')->unique();
            $table->string('password');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->enum('status', ['active', 'banned'])->default('active');
            $table->enum('role', ['customer', 'admin'])->default('customer');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
}