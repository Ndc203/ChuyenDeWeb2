<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserprofileTable extends Migration
{
    public function up()
    {
        Schema::create('userprofile', function (Blueprint $table) {
            $table->increments('profile_id');
            $table->unsignedInteger('user_id')->nullable();
            $table->string('full_name')->nullable();
            $table->string('avatar')->nullable();
            $table->text('bio')->nullable();
            $table->timestamps(0); // This will create created_at and updated_at columns
        });
    }

    public function down()
    {
        Schema::dropIfExists('userprofile');
    }
}