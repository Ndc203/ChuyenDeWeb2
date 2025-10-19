<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserloginhistoryTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('userloginhistory', function (Blueprint $table) {
            $table->increments('login_id');

            // KHỚP kiểu với users.user_id (UNSIGNED INT)
            $table->unsignedInteger('user_id')->nullable();

            $table->string('ip_address', 50)->nullable();
            $table->string('device', 100)->nullable();
            $table->timestamp('login_at')->useCurrent();

            // Ràng buộc FK đúng kiểu & tên
            $table->foreign('user_id')
                  ->references('user_id')->on('users')
                  ->cascadeOnDelete();

            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('userloginhistory');
    }
}
