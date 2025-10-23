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
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            
            // User relationship
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            
            // Product relationship
            $table->foreignId('product_id')->constrained('product')->cascadeOnDelete();
            
            // Cart item details
            $table->unsignedInteger('quantity');
            
            $table->timestamps();
            
            // Prevent duplicate cart items for same user and product
            $table->unique(['user_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};
