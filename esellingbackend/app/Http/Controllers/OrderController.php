<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class OrderController extends Controller
{
    /**
     * Confirm delivery by customer
     */
    public function confirmDelivery(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $order = Order::with(['orderItems.product', 'seller', 'user'])
            ->where('user_id', $user->id)
            ->find($id);
        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if ($order->delivery_confirmed_by_customer) {
            return response()->json([
                'success' => false,
                'message' => 'Delivery has already been confirmed for this order.',
            ], 422);
        }

        $order->update([
            'delivery_confirmed_by_customer' => true,
            'customer_delivery_confirmed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Delivery confirmed successfully.',
            'data' => $order,
        ]);
    }

    /**
     * Create a new order
     */
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:product,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'payment_method' => ['required', 'in:cop,gcash,paymaya,bank_transfer'],
            'notes' => ['nullable', 'string'],
            'payment_receipt' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            DB::beginTransaction();

            $items = $request->input('items');
            $ordersBySeller = [];
            $createdOrders = [];

            // Group items by seller and validate products
            foreach ($items as $item) {
                $product = Product::with('seller')->find($item['product_id']);
                
                if (!$product || !$product->is_active) {
                    throw new \Exception("Product not found or inactive: {$item['product_id']}");
                }

                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Insufficient stock for product: {$product->name}");
                }

                $sellerId = $product->seller_id;
                if (!isset($ordersBySeller[$sellerId])) {
                    $ordersBySeller[$sellerId] = [
                        'seller' => $product->seller,
                        'items' => [],
                        'subtotal' => 0
                    ];
                }

                $itemTotal = $product->price * $item['quantity'];
                $ordersBySeller[$sellerId]['subtotal'] += $itemTotal;
                $ordersBySeller[$sellerId]['items'][] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                    'total_price' => $itemTotal,
                    'product_name' => $product->name,
                    'product_image' => $product->main_image_url,
                ];
            }

            // Handle payment receipt upload for GCash
            $paymentReceiptUrl = null;
            if ($request->hasFile('payment_receipt')) {
                $path = $request->file('payment_receipt')->store('orders/receipts', 'public');
                $paymentReceiptUrl = Storage::url($path);
            }

            // Create separate orders for each seller
            foreach ($ordersBySeller as $sellerId => $sellerData) {
                $subtotal = $sellerData['subtotal'];
                // Pickup-only flow: no separate tax/shipping columns; total equals subtotal
                $totalAmount = $subtotal;

                // Determine initial status based on payment method
                $initialStatus = $request->input('payment_method') === 'cop' ? 'confirmed' : 'pending';

                // Create order for this seller
                $order = Order::create([
                    'user_id' => $user->id,
                    'seller_id' => $sellerId,
                    'order_number' => Order::generateOrderNumber(),
                    'status' => $initialStatus,
                    'subtotal' => $subtotal,
                    'total_amount' => $totalAmount,
                    'payment_method' => $request->input('payment_method'),
                    'payment_status' => 'pending',
                    'notes' => $request->input('notes'),
                    'payment_receipt_url' => $paymentReceiptUrl,
                ]);

                $createdOrders[] = $order;

                // Create order items for this seller's products
                foreach ($sellerData['items'] as $orderItemData) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_id' => $orderItemData['product']->id,
                        'quantity' => $orderItemData['quantity'],
                        'price' => $orderItemData['price'],
                        'total_price' => $orderItemData['total_price'],
                        'product_name' => $orderItemData['product_name'],
                        'product_image' => $orderItemData['product_image'],
                    ]);

                    // Update product stock
                    $product = $orderItemData['product'];
                    $product->decrement('stock', $orderItemData['quantity']);
                    $product->increment('sold_count', $orderItemData['quantity']);
                }
            }

            // Clear cart items that were ordered
            $productIds = collect($items)->pluck('product_id')->toArray();
            Cart::where('user_id', $user->id)
                ->whereIn('product_id', $productIds)
                ->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Orders created successfully.',
                'data' => [
                    'orders' => $createdOrders,
                    'total_orders' => count($createdOrders),
                    'message' => count($createdOrders) > 1 
                        ? 'Your order has been split into multiple orders due to different sellers.' 
                        : 'Order created successfully.'
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get user's orders
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

        $page = $request->get('page', 1);
        $limit = $request->get('limit', 10);
        $status = $request->get('status');

        $query = Order::with(['orderItems.product', 'seller'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        $orders = $query->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'message' => 'Orders fetched successfully.',
            'data' => $orders,
        ]);
    }

    /**
     * Get specific order details
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $order = Order::with(['orderItems.product', 'seller'])
            ->where('user_id', $user->id)
            ->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Order fetched successfully.',
            'data' => $order,
        ]);
    }

    /**
     * Update order status (admin only)
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => ['required', 'in:pending,payment_verified,confirmed,processing,ready_for_pickup,picked_up,cancelled,refunded'],
            'admin_notes' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $order = Order::find($id);
        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        $updateData = [
            'status' => $request->input('status'),
        ];

        if ($request->has('admin_notes')) {
            $updateData['admin_notes'] = $request->input('admin_notes');
        }

        $order->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully.',
            'data' => $order->load('orderItems.product'),
        ]);
    }

    /**
     * Update payment status
     */
    public function updatePaymentStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'payment_status' => ['required', 'in:pending,paid,failed,refunded'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'The given data was invalid.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $order = Order::find($id);
        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        $updateData = [
            'payment_status' => $request->input('payment_status'),
        ];

        if ($request->input('payment_status') === 'paid' && !$order->paid_at) {
            $updateData['paid_at'] = now();
        }

        $order->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Payment status updated successfully.',
            'data' => $order,
        ]);
    }

    /**
     * Cancel order
     */
    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $order = Order::with(['orderItems.product'])
            ->where('user_id', $user->id)
            ->find($id);
        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        if (!in_array($order->status, ['pending', 'confirmed'])) {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be cancelled at this stage.',
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Update order status
            $order->update(['status' => 'cancelled']);

            // Restore product stock
            foreach ($order->orderItems as $orderItem) {
                $product = Product::find($orderItem->product_id);
                if ($product) {
                    $product->increment('stock', $orderItem->quantity);
                    $product->decrement('sold_count', $orderItem->quantity);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order cancelled successfully.',
                'data' => $order,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel order.',
            ], 500);
        }
    }

    /**
     * Get seller's orders
     */
    public function getSellerOrders(Request $request)
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

        $page = $request->get('page', 1);
        $limit = $request->get('limit', 10);
        $status = $request->get('status');

        $query = Order::with(['orderItems.product', 'user'])
            ->where('seller_id', $seller->id)
            ->orderBy('created_at', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        $orders = $query->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'message' => 'Seller orders fetched successfully.',
            'data' => $orders,
        ]);
    }

    /**
     * Get seller order statistics
     */
    public function getSellerOrderStats(Request $request)
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

        $stats = [
            'total_orders' => Order::where('seller_id', $seller->id)->count(),
            'pending_orders' => Order::where('seller_id', $seller->id)->where('status', 'pending')->count(),
            'confirmed_orders' => Order::where('seller_id', $seller->id)->where('status', 'confirmed')->count(),
            'ready_for_pickup_orders' => Order::where('seller_id', $seller->id)->where('status', 'ready_for_pickup')->count(),
            'picked_up_orders' => Order::where('seller_id', $seller->id)->where('status', 'picked_up')->count(),
            'cancelled_orders' => Order::where('seller_id', $seller->id)->where('status', 'cancelled')->count(),
            'total_revenue' => Order::where('seller_id', $seller->id)->where('payment_status', 'paid')->sum('total_amount'),
            'pending_revenue' => Order::where('seller_id', $seller->id)->where('payment_status', 'pending')->sum('total_amount'),
        ];

        return response()->json([
            'success' => true,
            'message' => 'Seller order statistics fetched successfully.',
            'data' => $stats,
        ]);
    }
}
