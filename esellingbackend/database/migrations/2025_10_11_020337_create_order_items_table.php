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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            
            // Order relationship
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            
            // Product relationship
            $table->foreignId('product_id')->constrained('product')->cascadeOnDelete();
            
            // Order item details
            $table->unsignedInteger('quantity');
            $table->decimal('price', 10, 2); // Price at time of order
            $table->decimal('total_price', 10, 2); // quantity * price
            
            // Product snapshot (for historical data)
            $table->string('product_name', 160);
            $table->string('product_image', 512)->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
