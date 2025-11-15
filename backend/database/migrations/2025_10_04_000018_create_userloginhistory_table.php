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
            $table->id('login_history_id');

            $table->foreignId('user_id')
          ->constrained(
              table: 'users',    // Tên bảng tham chiếu
              column: 'user_id' // Tên cột tham chiếu
          )
          ->cascadeOnDelete();  

            $table->string('ip_address', 50)->nullable();
            $table->string('device', 100)->nullable();
            $table->timestamp('login_at')->useCurrent();

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
