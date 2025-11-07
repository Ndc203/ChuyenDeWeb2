<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('full_name')->nullable()->after('username');
            $table->string('avatar')->nullable()->after('full_name');
            $table->date('date_of_birth')->nullable()->after('address');
            $table->enum('gender', ['male', 'female', 'other'])->nullable()->after('date_of_birth');
            $table->string('department')->nullable()->after('gender');
            $table->timestamp('last_login_at')->nullable()->after('role');
            $table->text('about_me')->nullable()->after('department');
            $table->json('social_links')->nullable()->after('about_me');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'full_name',
                'avatar',
                'date_of_birth',
                'gender',
                'department',
                'last_login_at',
                'about_me',
                'social_links'
            ]);
        });
    }
};
