<?php

namespace App\Http\Controllers;

use App\Models\Refund;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class RefundController extends Controller
{
    /**
     * User requests refund for completed pickup order
     */
    public function store(Request $request, $orderId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Check if order exists and belongs to user
        $order = Order::where('user_id', $user->id)->find($orderId);
        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        // Check if order has been picked up (pickup-based flow)
        if ($order->status !== 'picked_up') {
            return response()->json([
                'success' => false,
                'message' => 'Refund can only be requested after the order has been picked up.',
            ], 422);
        }

        // Check if refund already exists
        if (Refund::where('order_id', $orderId)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Refund request already exists for this order.',
            ], 422);
        }

        $refund = Refund::create([
            'order_id' => $orderId,
            'user_id' => $user->id,
            'reason' => $request->input('reason'),
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Refund request submitted successfully.',
            'data' => $refund->load('order'),
        ], 201);
    }

    /**
     * Get user's refund requests
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $refunds = Refund::withOrder()
            ->forUser($user->id)
            ->orderBy('requested_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Refund requests fetched successfully.',
            'data' => $refunds,
        ]);
    }

    /**
     * Get seller's refund requests for their orders
     */
    public function getSellerRefunds(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Get seller profile
        $seller = \App\Models\Seller::where('user_id', $user->id)->first();
        if (!$seller) {
            return response()->json([
                'success' => false,
                'message' => 'Seller profile not found.',
            ], 404);
        }

        $refunds = Refund::withOrder()
            ->forSeller($seller->id)
            ->orderBy('requested_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Seller refund requests fetched successfully.',
            'data' => $refunds,
        ]);
    }

    /**
     * Update refund status (seller action)
     */
    public function updateStatus(Request $request, $refundId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Get seller profile
        $seller = \App\Models\Seller::where('user_id', $user->id)->first();
        if (!$seller) {
            return response()->json([
                'success' => false,
                'message' => 'Seller profile not found.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => ['required', 'in:approved,rejected'],
            'seller_response' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Find refund for this seller's orders
        $refund = Refund::whereHas('order', function ($query) use ($seller) {
            $query->where('seller_id', $seller->id);
        })->find($refundId);

        if (!$refund) {
            return response()->json([
                'success' => false,
                'message' => 'Refund request not found.',
            ], 404);
        }

        if ($refund->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Refund request has already been processed.',
            ], 422);
        }

        try {
            DB::beginTransaction();

            $status = $request->input('status');
            $sellerResponse = $request->input('seller_response');

            $updateData = [
                'status' => $status,
                'responded_at' => now(),
            ];

            if ($sellerResponse) {
                $updateData['seller_response'] = $sellerResponse;
            }

            $refund->update($updateData);

            // If approved, update order status to refunded
            if ($status === 'approved') {
                $refund->order->update(['status' => 'refunded']);

                // Restore product stock
                foreach ($refund->order->orderItems as $orderItem) {
                    $product = Product::find($orderItem->product_id);
                    if ($product) {
                        $product->increment('stock', $orderItem->quantity);
                        $product->decrement('sold_count', $orderItem->quantity);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Refund request ' . $status . ' successfully.',
                'data' => $refund->fresh(['order.orderItems.product']),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to process refund request.',
            ], 500);
        }
    }
}