<?php

namespace Database\Seeders;

use App\Models\Admin;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder as Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create an admin user
        Admin::create([
            'email' => 'admin@eselling.com',
            'password' => Hash::make('admin123'), // You can change this password
            'gcash_qr_url' => null, // Optional: Add GCash QR URL if needed
            'gcash_number' => null, // Optional: Add GCash number if needed
        ]);
    }
}
