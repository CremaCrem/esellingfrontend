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
        Schema::create('product', function (Blueprint $table) {
            $table->id();
            // Ownership: a product belongs to one seller
            $table->foreignId('seller_id')->constrained('seller')->cascadeOnDelete();

            // Identity & merchandising
            $table->string('name', 160);
            $table->string('slug', 180)->unique();
            $table->text('description')->nullable();
            $table->string('category', 120)->nullable();
            $table->string('sku', 80)->nullable();

            // Pricing & inventory
            $table->decimal('price', 10, 2); // PHP currency
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedInteger('sold_count')->default(0);

            // Presentation
            $table->string('main_image_url')->nullable();
            $table->json('images')->nullable(); // additional images

            // Optional specs (kept simple for MVP)
            $table->string('weight', 50)->nullable();
            $table->json('options')->nullable(); // e.g., colors/sizes

            // Status & lifecycle
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product');
    }
};
