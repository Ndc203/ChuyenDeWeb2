<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id('id');
            $table->string('username');
            $table->string('password');
            $table->string('email', 100);
            $table->string('phone', 15)->nullable();
            $table->string('address')->nullable();
            $table->enum('status', ['active', 'banned'])->default('active');
            $table->enum('role', ['customer', 'admin'])->default('customer');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
