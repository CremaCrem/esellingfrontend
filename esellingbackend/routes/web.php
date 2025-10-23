<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use Illuminate\Http\Request;
use App\Http\Controllers\SellerController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\RefundController;

Route::get('/', function () {
    return view('welcome');
});

// CSRF cookie endpoints for SPA
Route::get('/csrf-cookie', function (Request $request) {
    return response()->json(['success' => true])->withCookie(cookie()->forever('XSRF-TOKEN', csrf_token(), '/', null, false, false, false, 'Lax'));
});
Route::get('/sanctum/csrf-cookie', function (Request $request) {
    return response()->json(['success' => true])->withCookie(cookie()->forever('XSRF-TOKEN', csrf_token(), '/', null, false, false, false, 'Lax'));
});

// API routes (prefixed at /api by frontend expectation)
Route::prefix('api')->group(function () {
    // User authentication
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'update']);
    Route::post('/user', [AuthController::class, 'update']);
    Route::delete('/user', [AuthController::class, 'destroy']);

    // Admin authentication
    Route::post('/admin/login', [AdminController::class, 'login']);
    Route::post('/admin/logout', [AdminController::class, 'logout']);
    Route::get('/admin/user', [AdminController::class, 'user']);
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/admin/pending-applications', [AdminController::class, 'getPendingApplications']);
    Route::post('/admin/process-application/{sellerId}', [AdminController::class, 'processApplication']);

    // Admin GCash settings and payment verification
    Route::get('/admin/gcash-settings', [AdminController::class, 'getGcashSettings']);
    Route::post('/admin/gcash-settings', [AdminController::class, 'updateGcashSettings']);
    Route::get('/admin/pending-payments', [AdminController::class, 'getPendingPayments']);
    Route::post('/admin/verify-payment/{orderId}', [AdminController::class, 'verifyPayment']);
    Route::post('/admin/reject-payment/{orderId}', [AdminController::class, 'rejectPayment']);
    Route::get('/admin/all-payments', [AdminController::class, 'getAllPayments']);
    Route::post('/admin/mark-distributed/{orderId}', [AdminController::class, 'markPaymentDistributed']);

    // Seller
    Route::post('/sellers', [SellerController::class, 'store']);
    Route::get('/sellers/me', [SellerController::class, 'me']);
    Route::put('/sellers/me', [SellerController::class, 'update']);
    Route::get('/sellers/{id}', [SellerController::class, 'show']);

    // Products
    Route::post('/products', [ProductController::class, 'store']);
    Route::get('/products', [ProductController::class, 'index'])->middleware('cache.headers:public;max_age=300'); // 5 minutes cache
    Route::get('/products/{id}', [ProductController::class, 'show'])->middleware('cache.headers:public;max_age=300');
    Route::get('/sellers/{sellerId}/products', [ProductController::class, 'bySeller'])->middleware('cache.headers:public;max_age=300');

    // Cart
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::patch('/cart/{id}', [CartController::class, 'update']);
    Route::delete('/cart/{id}', [CartController::class, 'destroy']);
    Route::post('/cart/clear', [CartController::class, 'clear']);

    // Orders
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::patch('/orders/{id}/payment-status', [OrderController::class, 'updatePaymentStatus']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{id}/confirm-delivery', [OrderController::class, 'confirmDelivery']);

    // Refunds
    Route::post('/orders/{id}/refund', [RefundController::class, 'store']);
    Route::get('/refunds', [RefundController::class, 'index']);
    Route::get('/seller/refunds', [RefundController::class, 'getSellerRefunds']);
    Route::patch('/refunds/{id}', [RefundController::class, 'updateStatus']);


    // Seller Orders
    Route::get('/seller/orders', [OrderController::class, 'getSellerOrders']);
    Route::get('/seller/orders/stats', [OrderController::class, 'getSellerOrderStats']);
});
