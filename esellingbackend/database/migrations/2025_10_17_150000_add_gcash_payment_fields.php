<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add GCash fields to admin table
        Schema::table('admin', function (Blueprint $table) {
            $table->string('gcash_qr_url', 2048)->nullable();
            $table->string('gcash_number', 20)->nullable();
        });

        // Add GCash payment fields to orders table
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_receipt_url', 2048)->nullable();
            $table->boolean('payment_distributed')->default(false);
            $table->timestamp('payment_distributed_at')->nullable();
        });

        // First add 'cop' to the enum
        DB::statement("ALTER TABLE orders MODIFY COLUMN payment_method ENUM('cod', 'cop', 'gcash', 'paymaya', 'bank_transfer') DEFAULT 'cod'");
        
        // Update existing 'cod' records to 'cop'
        DB::statement("UPDATE orders SET payment_method = 'cop' WHERE payment_method = 'cod'");
        
        // Now remove 'cod' from the enum
        DB::statement("ALTER TABLE orders MODIFY COLUMN payment_method ENUM('cop', 'gcash', 'paymaya', 'bank_transfer') DEFAULT 'cop'");
        
        // Update status enum to add 'payment_verified'
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'payment_verified', 'confirmed', 'processing', 'ready_for_pickup', 'picked_up', 'cancelled', 'refunded') DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First update existing 'cop' records back to 'cod'
        DB::statement("UPDATE orders SET payment_method = 'cod' WHERE payment_method = 'cop'");
        
        // Revert enum changes
        DB::statement("ALTER TABLE orders MODIFY COLUMN payment_method ENUM('cod', 'gcash', 'paymaya', 'bank_transfer') DEFAULT 'cod'");
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending'");

        // Drop GCash fields from orders table
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['payment_receipt_url', 'payment_distributed', 'payment_distributed_at']);
        });

        // Drop GCash fields from admin table
        Schema::table('admin', function (Blueprint $table) {
            $table->dropColumn(['gcash_qr_url', 'gcash_number']);
        });
    }
};
