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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            
            // Customer relationship - one user can have multiple orders
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            
            // Seller relationship - for seller-specific order management
            $table->foreignId('seller_id')->constrained('seller')->cascadeOnDelete();
            
            // Order identification
            $table->string('order_number', 50)->unique();
            $table->enum('status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])->default('pending');
            
            // Order totals
            $table->decimal('subtotal', 10, 2);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('shipping_cost', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);
            
            // Shipping information
            $table->string('shipping_name', 120);
            $table->string('shipping_phone', 32);
            $table->text('shipping_address');
            $table->string('shipping_city', 80);
            $table->string('shipping_province', 80);
            $table->string('shipping_postal_code', 16);
            
            // Payment information
            $table->enum('payment_method', ['cod', 'gcash', 'paymaya', 'bank_transfer'])->default('cod');
            $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            
            // Tracking
            $table->string('tracking_number', 100)->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            
            // Notes
            $table->text('notes')->nullable();
            $table->text('admin_notes')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
