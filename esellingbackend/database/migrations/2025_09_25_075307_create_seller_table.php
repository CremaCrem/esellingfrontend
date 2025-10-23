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
        Schema::create('seller', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            // Identity
            $table->string('shop_name', 120);
            $table->string('slug', 140)->unique();
            $table->text('description')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('banner_url')->nullable();

            // Contact & location
            $table->string('contact_email')->nullable();
            $table->string('contact_phone', 32)->nullable();
            $table->string('region', 80)->nullable();
            $table->string('province', 80)->nullable();
            $table->string('city', 80)->nullable();
            $table->string('barangay', 120)->nullable();
            $table->string('address_line', 180)->nullable();
            $table->string('postal_code', 16)->nullable();

            // Verification & activity
            $table->enum('verification_status', ['unverified', 'verified'])->default('unverified')->index();
            $table->boolean('is_active')->default(true);

            // Performance snapshots (aggregates)
            $table->decimal('rating_average', 3, 2)->default(0);
            $table->unsignedInteger('rating_count')->default(0);
            $table->unsignedInteger('order_count')->default(0);
            $table->unsignedInteger('product_count')->default(0);
            $table->unsignedTinyInteger('response_rate')->default(0); // 0-100
            $table->unsignedInteger('avg_response_time_ms')->default(0);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seller');
    }
};
