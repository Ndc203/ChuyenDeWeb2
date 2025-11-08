<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUserprofileTable extends Migration
{
    public function up()
    {
        //File này sẽ chứa tất cả các trường thông tin cá nhân. Nó liên kết 1-1 với bảng users qua user_id.
        Schema::create('userprofile', function (Blueprint $table) {
            $table->id('profile_id');

            // --- LIÊN KẾT 1-1 VỚI BẢNG USERS ---
            // SỬA: Dùng foreignId() (BIGINT) và thêm UNIQUE
            $table->foreignId('user_id')
                  ->unique() // Đảm bảo quan hệ 1-1
                  ->constrained(
                      table: 'users',
                      column: 'user_id'
                  )
                  ->onDelete('cascade'); // Xóa profile nếu user bị xóa

            // --- CÁC TRƯỜNG GỘP TỪ 2 FILE KIA ---
            
            // (Từ file add_profile_fields)
            $table->string('full_name')->nullable();
            $table->string('avatar')->nullable();
            
            // (Từ file create_users)
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            
            // (Từ file add_profile_fields)
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('department')->nullable();
            $table->text('about_me')->nullable(); // (Thay cho 'bio')
            $table->json('social_links')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('userprofile');
    }
}