<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\Seller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    /**
     * Handle admin login
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        // Use the admin guard for authentication
        if (!Auth::guard('admin')->attempt($credentials, $request->has('remember'))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid admin credentials.',
            ], 422);
        }

        $request->session()->regenerate();

        $admin = Auth::guard('admin')->user();

        return response()->json([
            'success' => true,
            'message' => 'Admin login successful.',
            'admin' => [
                'id' => $admin->id,
                'email' => $admin->email,
                'user_type' => 'admin',
            ],
        ]);
    }

    /**
     * Return current authenticated admin
     */
    public function user(Request $request)
    {
        $admin = Auth::guard('admin')->user();
        
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Authenticated admin fetched.',
            'admin' => [
                'id' => $admin->id,
                'email' => $admin->email,
                'user_type' => 'admin',
            ],
        ]);
    }

    /**
     * Handle admin logout
     */
    public function logout(Request $request)
    {
        Auth::guard('admin')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Admin logged out.',
        ]);
    }

    /**
     * Get admin dashboard data
     */
    public function dashboard(Request $request)
    {
        $admin = Auth::guard('admin')->user();
        
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Get dashboard statistics
        $stats = [
            'total_sellers' => Seller::count(),
            'pending_verifications' => Seller::where('verification_status', 'unverified')->count(),
            'verified_sellers' => Seller::where('verification_status', 'verified')->count(),
            'active_sellers' => Seller::where('is_active', true)->count(),
        ];

        // Get recent seller applications
        $recentApplications = Seller::with('user')
            ->where('verification_status', 'unverified')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Dashboard data fetched.',
            'data' => [
                'stats' => $stats,
                'recent_applications' => $recentApplications,
            ],
        ]);
    }

    /**
     * Get all pending seller applications
     */
    public function getPendingApplications(Request $request)
    {
        $admin = Auth::guard('admin')->user();
        
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $applications = Seller::with('user')
            ->where('verification_status', 'unverified')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Pending applications fetched.',
            'data' => $applications,
        ]);
    }

    /**
     * Verify or reject a seller application
     */
    public function processApplication(Request $request, $sellerId)
    {
        $admin = Auth::guard('admin')->user();
        
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'action' => ['required', 'in:approve,reject'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $seller = Seller::find($sellerId);

        if (!$seller) {
            return response()->json([
                'success' => false,
                'message' => 'Seller not found.',
            ], 404);
        }

        if ($seller->verification_status !== 'unverified') {
            return response()->json([
                'success' => false,
                'message' => 'Application has already been processed.',
            ], 400);
        }

        $action = $request->input('action');
        $notes = $request->input('notes');

        if ($action === 'approve') {
            $seller->update([
                'verification_status' => 'verified',
            ]);
            $message = 'Seller application approved successfully.';
        } else {
            // Set status to rejected when admin rejects the application
            $seller->update([
                'verification_status' => 'rejected',
            ]);
            $message = 'Seller application rejected.';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $seller->fresh(['user']),
        ]);
    }

    /**
     * Get GCash settings
     */
    public function getGcashSettings(Request $request)
    {
        // Allow public read of GCash settings so customers can checkout with GCash
        // If an admin is logged in, use their record; otherwise load the first Admin record
        /** @var \App\Models\Admin|null $admin */
        $admin = Auth::guard('admin')->user();
        $adminRecord = $admin ?: Admin::first();

        if (!$adminRecord) {
            return response()->json([
                'success' => true,
                'message' => 'GCash settings not configured.',
                'data' => [
                    'gcash_qr_url' => null,
                    'gcash_number' => null,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'GCash settings fetched.',
            'data' => [
                'gcash_qr_url' => $adminRecord->gcash_qr_url,
                'gcash_number' => $adminRecord->gcash_number,
            ],
        ]);
    }

    /**
     * Update GCash settings
     */
    public function updateGcashSettings(Request $request)
    {
        /** @var \App\Models\Admin $admin */
        $admin = Auth::guard('admin')->user();
        
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'gcash_number' => ['nullable', 'string', 'max:20'],
            'gcash_qr' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $updateData = [];

        if ($request->has('gcash_number')) {
            $updateData['gcash_number'] = $request->input('gcash_number');
        }

        if ($request->hasFile('gcash_qr')) {
            // Delete old QR if exists
            if ($admin->gcash_qr_url) {
                $oldPath = str_replace('/storage/', '', $admin->gcash_qr_url);
                Storage::disk('public')->delete($oldPath);
            }

            // Store new QR
            $path = $request->file('gcash_qr')->store('admin/gcash', 'public');
            $updateData['gcash_qr_url'] = Storage::url($path);
        }

        $admin->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'GCash settings updated successfully.',
            'data' => [
                'gcash_qr_url' => $admin->gcash_qr_url,
                'gcash_number' => $admin->gcash_number,
            ],
        ]);
    }

    /**
     * Get pending payments
     */
    public function getPendingPayments(Request $request)
    {
        /** @var \App\Models\Admin $admin */
        $admin = Auth::guard('admin')->user();
        
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $orders = Order::with(['user', 'seller', 'orderItems.product'])
            ->where('payment_method', 'gcash')
            ->where('payment_status', 'pending')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Pending payments fetched.',
            'data' => $orders,
        ]);
    }

    /**
     * Verify payment
     */
    public function verifyPayment(Request $request, $orderId)
    {
        /** @var \App\Models\Admin $admin */
        $admin = Auth::guard('admin')->user();
        
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $order = Order::find($orderId);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if ($order->payment_method !== 'gcash') {
            return response()->json([
                'success' => false,
                'message' => 'This order is not a GCash payment.',
            ], 422);
        }

        if ($order->payment_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This payment has already been processed.',
            ], 422);
        }

        $order->update([
            'payment_status' => 'paid',
            'status' => 'payment_verified',
            'paid_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment verified successfully.',
            'data' => $order->load(['user', 'seller', 'orderItems.product']),
        ]);
    }

    /**
     * Reject payment
     */
    public function rejectPayment(Request $request, $orderId)
    {
        /** @var \App\Models\Admin $admin */
        $admin = Auth::guard('admin')->user();
        
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'reason' => ['required', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $order = Order::find($orderId);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if ($order->payment_method !== 'gcash') {
            return response()->json([
                'success' => false,
                'message' => 'This order is not a GCash payment.',
            ], 422);
        }

        if ($order->payment_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'This payment has already been processed.',
            ], 422);
        }

        // Update order status to rejected and store rejection reason in admin_notes
        $order->update([
            'status' => 'rejected',
            'payment_status' => 'failed',
            'admin_notes' => $request->input('reason'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment rejected successfully.',
            'data' => $order->load(['user', 'seller', 'orderItems.product']),
        ]);
    }

    /**
     * Get all payments for distribution tracking
     */
    public function getAllPayments(Request $request)
    {
        /** @var \App\Models\Admin $admin */
        $admin = Auth::guard('admin')->user();
        
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $query = Order::with(['user', 'seller', 'orderItems.product'])
            ->whereIn('payment_method', ['gcash', 'cop'])
            ->orderBy('created_at', 'desc');

        // Filter by seller if provided
        if ($request->has('seller_id')) {
            $query->where('seller_id', $request->input('seller_id'));
        }

        // Filter by payment method if provided
        if ($request->has('payment_method')) {
            $query->where('payment_method', $request->input('payment_method'));
        }

        // Filter by payment status if provided
        if ($request->has('payment_status')) {
            $query->where('payment_status', $request->input('payment_status'));
        }

        $orders = $query->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'All payments fetched.',
            'data' => $orders,
        ]);
    }

    /**
     * Mark payment as distributed
     */
    public function markPaymentDistributed(Request $request, $orderId)
    {
        /** @var \App\Models\Admin $admin */
        $admin = Auth::guard('admin')->user();
        
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $order = Order::find($orderId);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if ($order->payment_distributed) {
            return response()->json([
                'success' => false,
                'message' => 'Payment has already been marked as distributed.',
            ], 422);
        }

        $order->update([
            'payment_distributed' => true,
            'payment_distributed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment marked as distributed successfully.',
            'data' => $order->load(['user', 'seller', 'orderItems.product']),
        ]);
    }
}
