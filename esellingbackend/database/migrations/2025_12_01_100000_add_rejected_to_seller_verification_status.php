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
        // Add 'rejected' to the verification_status enum
        $new_enum = "'unverified', 'verified', 'rejected'";
        
        DB::statement("ALTER TABLE seller CHANGE verification_status verification_status ENUM($new_enum) NOT NULL DEFAULT 'unverified'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum without 'rejected'
        $old_enum = "'unverified', 'verified'";
        
        DB::statement("ALTER TABLE seller CHANGE verification_status verification_status ENUM($old_enum) NOT NULL DEFAULT 'unverified'");
    }
};

