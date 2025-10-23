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
        Schema::table('seller', function (Blueprint $table) {
            $table->dropColumn([
                'region',
                'province', 
                'city',
                'barangay',
                'address_line',
                'postal_code'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seller', function (Blueprint $table) {
            $table->string('region', 80)->nullable();
            $table->string('province', 80)->nullable();
            $table->string('city', 80)->nullable();
            $table->string('barangay', 120)->nullable();
            $table->string('address_line', 180)->nullable();
            $table->string('postal_code', 16)->nullable();
        });
    }
};
