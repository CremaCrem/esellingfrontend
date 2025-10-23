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
        Schema::table('orders', function (Blueprint $table) {
            // Drop delivery/shipping-related fields for pickup-only flow
            $table->dropColumn([
                // Shipping/Cost Fields
                'tax_amount',
                'shipping_cost',
                'tracking_number',
                'shipped_at',
                'delivered_at',

                // Shipping Address/Contact Details
                'shipping_name',
                'shipping_phone',
                'shipping_address',
                'shipping_city',
                'shipping_province',
                'shipping_postal_code',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Recreate dropped columns with original definitions
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('shipping_cost', 10, 2)->default(0);
            $table->string('tracking_number', 100)->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->string('shipping_name', 120);
            $table->string('shipping_phone', 32);
            $table->text('shipping_address');
            $table->string('shipping_city', 80);
            $table->string('shipping_province', 80);
            $table->string('shipping_postal_code', 16);
        });
    }
};