<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Add 'rejected' to the enum first (includes both refunded and rejected and payment_verified)
        $enum_with_both = "'pending', 'confirmed', 'processing', 'ready_for_pickup', 'picked_up', 'cancelled', 'refunded', 'rejected', 'payment_verified'";
        DB::statement("ALTER TABLE orders CHANGE status status ENUM($enum_with_both) NOT NULL DEFAULT 'pending'");

        // Step 2: Update any orders with 'refunded' status to 'rejected'
        DB::table('orders')
            ->where('status', 'refunded')
            ->update(['status' => 'rejected']);

        // Step 3: Now remove 'refunded' from the enum (keep 'payment_verified' as it's used)
        $new_enum = "'pending', 'confirmed', 'processing', 'ready_for_pickup', 'picked_up', 'cancelled', 'rejected', 'payment_verified'";
        DB::statement("ALTER TABLE orders CHANGE status status ENUM($new_enum) NOT NULL DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Update 'rejected' status back to 'refunded'
        DB::table('orders')
            ->where('status', 'rejected')
            ->update(['status' => 'refunded']);

        // Revert back to 'refunded' if needed
        $old_enum = "'pending', 'confirmed', 'processing', 'ready_for_pickup', 'picked_up', 'cancelled', 'refunded'";
        
        DB::statement("ALTER TABLE orders CHANGE status status ENUM($old_enum) NOT NULL DEFAULT 'pending'");
    }
};

