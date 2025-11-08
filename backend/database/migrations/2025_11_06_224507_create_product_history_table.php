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
        // Drop leftover table from previous failed migrations to ensure schema is recreated
        if (Schema::hasTable('product_history')) {
            Schema::drop('product_history');
        }

        Schema::create('product_history', function (Blueprint $table) {
            $table->id('history_id');
            $table->unsignedInteger('product_id'); // match products.product_id (increments)
            $table->unsignedInteger('user_id')->nullable(); // match users.user_id (increments)
            $table->string('action', 50); // 'created', 'updated', 'deleted', 'restored'
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('changed_fields')->nullable();
            $table->text('description')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            // Foreign keys
            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
            $table->foreign('user_id')->references('user_id')->on('users')->onDelete('set null');

            // Indexes
            $table->index('product_id');
            $table->index('user_id');
            $table->index('action');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_history');
    }
};
