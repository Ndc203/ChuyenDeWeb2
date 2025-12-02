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
            $table->id('product_history_id');
            // SỬA: Đổi 'product_id' từ INT (unsignedInteger) sang BIGINT (foreignId)
            $table->foreignId('product_id')
                  ->constrained(
                      table: 'products',
                      column: 'product_id'
                  )
                  ->onDelete('cascade');

            // SỬA: Đổi 'user_id' từ INT (unsignedInteger) sang BIGINT (foreignId)
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained(
                      table: 'users',
                      column: 'user_id'
                  )
                  ->onDelete('set null');
            $table->string('action', 50); // 'created', 'updated', 'deleted', 'restored'
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('changed_fields')->nullable();
            $table->text('description')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            // XÓA: Các $table->foreign() thủ công vì foreignId() đã xử lý rồi

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
