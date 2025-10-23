<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('seller', function (Blueprint $table) {
            $table->dropColumn([
                'rating_average',
                'rating_count',
                'response_rate',
                'avg_response_time_ms'
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('seller', function (Blueprint $table) {
            // Recreate with reasonable defaults; adjust types to match your previous schema if different
            $table->decimal('rating_average', 3, 2)->nullable();
            $table->unsignedInteger('rating_count')->default(0);
            $table->decimal('response_rate', 5, 2)->nullable();
            $table->unsignedInteger('avg_response_time_ms')->default(0);
        });
    }
};