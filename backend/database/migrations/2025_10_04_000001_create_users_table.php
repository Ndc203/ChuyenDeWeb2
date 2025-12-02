<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUsersTable extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            // --- CÁC CỘT CỐT LÕI ---
            $table->id('user_id'); // BIGINT
            $table->string('username')->unique();
            $table->string('password');
            $table->string('email')->unique();
            $table->enum('status', ['active', 'banned'])->default('active');
            $table->enum('role', ['customer', 'admin'])->default('customer');
            
            // Lấy từ file 'add_profile_fields' vì nó liên quan đến auth
            $table->timestamp('last_login_at')->nullable(); 
            
            $table->timestamps();
            
            // XÓA: phone, address (sẽ chuyển sang profile)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
}