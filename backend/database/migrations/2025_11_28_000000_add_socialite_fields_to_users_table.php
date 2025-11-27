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
            // Make password nullable for social logins
            $table->string('password')->nullable()->change();

            // Add fields for Socialite
            $table->string('provider')->nullable();
            $table->string('provider_id')->nullable();
            $table->string('avatar')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // It's tricky to revert password to not nullable if there are null values.
            // For this example, we'll assume it's safe.
            $table->string('password')->nullable(false)->change();

            $table->dropColumn(['provider', 'provider_id', 'avatar']);
        });
    }
};
