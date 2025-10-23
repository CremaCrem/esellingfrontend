<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB; // <-- Import the DB Facade!

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Define the new set of ENUM values for the pickup system
        $new_enum = "'pending', 'confirmed', 'processing', 'ready_for_pickup', 'picked_up', 'cancelled', 'refunded'";
        
        // Use raw SQL to alter the table and change the ENUM definition
        DB::statement("ALTER TABLE orders CHANGE status status ENUM($new_enum) NOT NULL DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Define the old set of ENUM values for the delivery system
        $old_enum = "'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'";

        // Use raw SQL to revert the ENUM back to its original definition
        DB::statement("ALTER TABLE orders CHANGE status status ENUM($old_enum) NOT NULL DEFAULT 'pending'");
    }
};