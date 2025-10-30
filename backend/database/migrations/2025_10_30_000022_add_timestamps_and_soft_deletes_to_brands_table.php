<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('brands', 'created_at')) {
            Schema::table('brands', function (Blueprint $table): void {
                $table->timestamp('created_at')->nullable()->after('status');
            });
        }

        if (!Schema::hasColumn('brands', 'updated_at')) {
            Schema::table('brands', function (Blueprint $table): void {
                $table->timestamp('updated_at')->nullable()->after('created_at');
            });
        }

        if (!Schema::hasColumn('brands', 'deleted_at')) {
            Schema::table('brands', function (Blueprint $table): void {
                $table->softDeletes();
            });
        }

        DB::table('brands')
            ->whereNull('created_at')
            ->update([
                'created_at' => now(),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        Schema::table('brands', function (Blueprint $table): void {
            if (Schema::hasColumn('brands', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
            if (Schema::hasColumn('brands', 'updated_at')) {
                $table->dropColumn('updated_at');
            }
            if (Schema::hasColumn('brands', 'created_at')) {
                $table->dropColumn('created_at');
            }
        });
    }
};
