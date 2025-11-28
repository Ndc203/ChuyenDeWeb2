<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('stock_transactions')) {
            return;
        }

        Schema::create('stock_transactions', function (Blueprint $table) {
            $table->id('stock_transaction_id');
            $table->foreignId('product_id')
                  ->constrained('products', 'product_id')
                  ->onDelete('cascade');
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users', 'user_id')
                  ->nullOnDelete();
            $table->enum('type', ['import', 'export']);
            $table->integer('quantity');
            $table->string('note')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['product_id', 'created_at']);
            $table->index('user_id');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transactions');
    }
};
