import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { Package, Truck, CheckCircle, Clock, Eye, X } from "lucide-react";
import { apiService, getAssetUrl } from "../services/api";
import type { Order, OrderItem } from "../services/api";
import Toast from "../components/Toast";
import Footer from "../components/Footer";
import ConfirmationModal from "../components/ConfirmationModal";
import Modal from "../components/Modal";

const MyPurchases: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    message: "",
    type: "success" as "success" | "error" | "warning" | "info",
    isVisible: false,
  });

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const status = activeTab === "all" ? undefined : activeTab;
      const response = await apiService.getOrders(status);
      if (response.success && response.data) {
        // Handle paginated response - orders are in response.data.data
        const ordersData = response.data.data || response.data;
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      showToast("Failed to fetch orders", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, isVisible: true });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          text: "Pending",
        };
      case "confirmed":
        return {
          icon: CheckCircle,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          text: "Confirmed",
        };
      case "processing":
        return {
          icon: Clock,
          color: "text-orange-600",
          bgColor: "bg-orange-100",
          text: "Processing",
        };
      case "ready_for_pickup":
        return {
          icon: Truck,
          color: "text-purple-600",
          bgColor: "bg-purple-100",
          text: "Ready for Pickup",
        };
      case "picked_up":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
          text: "Picked Up",
        };
      case "cancelled":
        return {
          icon: X,
          color: "text-red-600",
          bgColor: "bg-red-100",
          text: "Cancelled",
        };
      case "rejected":
        return {
          icon: X,
          color: "text-red-600",
          bgColor: "bg-red-100",
          text: "Rejected",
        };
      default:
        return {
          icon: Package,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          text: status.charAt(0).toUpperCase() + status.slice(1),
        };
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      const response = await apiService.cancelOrder(orderId);
      if (response.success) {
        showToast("Order cancelled successfully", "success");
        fetchOrders(); // Refresh orders
        setShowCancelModal(false);
        setOrderToCancel(null);
      } else {
        showToast("Failed to cancel order", "error");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      showToast("Failed to cancel order", "error");
    }
  };

  const openCancelModal = (order: Order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const openDetailsModal = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleConfirmDelivery = async (orderId: number) => {
    try {
      const response = await apiService.confirmDelivery(orderId);
      if (response.success) {
        showToast("Delivery confirmed successfully", "success");
        fetchOrders(); // Refresh orders
      } else {
        showToast("Failed to confirm delivery", "error");
      }
    } catch (error) {
      console.error("Error confirming delivery:", error);
      showToast("Failed to confirm delivery", "error");
    }
  };

  const canCancelOrder = (status: string) => {
    return ["pending", "confirmed", "processing"].includes(status);
  };

  const canConfirmDelivery = (status: string, deliveryConfirmed: boolean) => {
    // In pickup flow, allow confirming pickup completion when marked picked_up
    return status === "picked_up" && !deliveryConfirmed;
  };

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
        duration={3000}
      />

      <div className="min-h-screen bg-stone-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-stone-800 mb-2">
              My Purchases
            </h1>
            <p className="text-stone-600">
              Track your orders and view purchase history
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm border border-stone-200 mb-8 overflow-x-auto">
            {[
              { key: "all", label: "All Orders" },
              { key: "pending", label: "Pending" },
              { key: "confirmed", label: "Confirmed" },
              { key: "processing", label: "Processing" },
              { key: "ready_for_pickup", label: "Ready for Pickup" },
              { key: "picked_up", label: "Picked Up" },
              { key: "cancelled", label: "Cancelled" },
              { key: "rejected", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-amber-600 text-white"
                    : "text-stone-700 hover:text-stone-900 hover:bg-stone-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="text-amber-600">Loading orders...</div>
            </div>
          )}

          {/* Orders List */}
          {!loading && (
            <div className="space-y-6">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden"
                  >
                    {/* Order Header */}
                    <div className="p-6 border-b border-stone-200 bg-stone-50/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`p-2 rounded-full ${statusInfo.bgColor}`}
                          >
                            <StatusIcon
                              className={`h-5 w-5 ${statusInfo.color}`}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-stone-800">
                              Order #{order.order_number}
                            </h3>
                            <p className="text-sm text-stone-600">
                              Placed on{" "}
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            {order.seller && (
                              <p className="text-sm text-stone-600">
                                Seller: {order.seller.shop_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-stone-800">
                            ₱{order.total_amount.toLocaleString()}
                          </div>
                          <div className="text-sm text-stone-600">
                            {order.order_items.length} item
                            {order.order_items.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="p-6">
                      <div className="space-y-4">
                        {order.order_items.map((item: OrderItem) => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-4"
                          >
                            <div className="w-16 h-16 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              {item.product_image ? (
                                <img
                                  src={getAssetUrl(item.product_image)}
                                  alt={item.product_name}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    target.nextElementSibling?.classList.remove(
                                      "hidden"
                                    );
                                  }}
                                />
                              ) : null}
                              <span
                                className={`text-xs text-stone-600 ${
                                  item.product_image ? "hidden" : ""
                                }`}
                              >
                                IMG
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-stone-800 mb-1 line-clamp-1">
                                {item.product_name}
                              </h4>
                              <div className="text-sm text-stone-600">
                                Qty: {item.quantity} × ₱
                                {item.price.toLocaleString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-stone-800">
                                ₱{item.total_price.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Details */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-stone-800 mb-2">
                              Order Details
                            </h5>
                            <div className="space-y-1 text-sm text-stone-600">
                              <div>
                                Subtotal: ₱{order.subtotal.toLocaleString()}
                              </div>
                              {/* Shipping and Tax removed for pickup-only flow */}
                              <div className="font-medium text-stone-800">
                                Total: ₱{order.total_amount.toLocaleString()}
                              </div>
                              <div>
                                Payment:{" "}
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    order.payment_method === "gcash"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-green-100 text-green-800"
                                  }`}
                                >
                                  {order.payment_method === "gcash"
                                    ? "GCash"
                                    : "Cash on Pickup"}
                                </span>
                              </div>
                              {order.payment_method === "gcash" && (
                                <div>
                                  Payment Status:{" "}
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      order.payment_status === "paid"
                                        ? "bg-green-100 text-green-800"
                                        : order.payment_status === "pending"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {order.payment_status === "pending"
                                      ? "Awaiting Verification"
                                      : order.payment_status}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Rejection Reason Display */}
                          {order.status === "rejected" && order.admin_notes && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h5 className="font-medium text-red-800 mb-1">
                                    Order Rejected
                                  </h5>
                                  <p className="text-sm text-red-700">
                                    {order.admin_notes}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Shipping Information removed for pickup-only flow */}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-6 flex flex-wrap gap-3">
                          {/* Cancel Order */}
                          {canCancelOrder(order.status) && (
                            <button
                              onClick={() => openCancelModal(order)}
                              className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <X className="h-4 w-4" />
                              <span>Cancel Order</span>
                            </button>
                          )}

                          {/* Confirm Delivery */}
                          {canConfirmDelivery(
                            order.status,
                            order.delivery_confirmed_by_customer
                          ) && (
                            <button
                              onClick={() => handleConfirmDelivery(order.id)}
                              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Confirm Delivery</span>
                            </button>
                          )}

                          {/* Tracking removed for pickup flow */}

                          {/* View Details */}
                          <button
                            onClick={() => openDetailsModal(order)}
                            className="flex items-center space-x-2 px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
                          >
                            <Eye className="h-4 w-4 text-stone-600" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {orders.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Package className="h-12 w-12 text-stone-500" />
                  </div>
                  <h3 className="text-xl font-medium text-stone-800 mb-2">
                    No orders found
                  </h3>
                  <p className="text-stone-600 mb-6">
                    {activeTab === "all"
                      ? "You haven't made any purchases yet."
                      : `No ${activeTab} orders found.`}
                  </p>
                  {activeTab === "all" && (
                    <button
                      onClick={() => (window.location.href = "/dashboard")}
                      className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                    >
                      Start Shopping
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setOrderToCancel(null);
        }}
        onConfirm={() => orderToCancel && handleCancelOrder(orderToCancel.id)}
        title="Cancel Order"
        message={
          orderToCancel
            ? `Are you sure you want to cancel order ${orderToCancel.order_number}? This action cannot be undone.`
            : ""
        }
        confirmText="Cancel Order"
        cancelText="Keep Order"
        variant="danger"
      />

      {/* Order Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }}
        title="Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Summary */}
            <div>
              <h4 className="font-semibold text-stone-800 mb-3">
                Order Summary
              </h4>
              <div className="bg-stone-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-600">Subtotal:</span>
                  <span>₱{selectedOrder.subtotal.toLocaleString()}</span>
                </div>
                {/* Shipping and Tax removed for pickup-only flow */}
                <div className="flex justify-between font-semibold text-stone-800 border-t pt-2">
                  <span>Total:</span>
                  <span>₱{selectedOrder.total_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Payment Method:</span>
                  <span className="capitalize">
                    {selectedOrder.payment_method}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Payment Status:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      selectedOrder.payment_status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {selectedOrder.payment_status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Information removed for pickup-only flow */}

            {/* Seller Information */}
            {selectedOrder.seller && (
              <div>
                <h4 className="font-semibold text-stone-800 mb-3">
                  Seller Information
                </h4>
                <div className="bg-stone-50 p-4 rounded-lg">
                  <p className="font-medium text-stone-800">
                    {selectedOrder.seller.shop_name}
                  </p>
                  <p className="text-sm text-stone-600">
                    Seller ID: {selectedOrder.seller_id}
                  </p>
                </div>
              </div>
            )}

            {/* Order Notes */}
            {selectedOrder.notes && (
              <div>
                <h4 className="font-semibold text-stone-800 mb-3">
                  Order Notes
                </h4>
                <div className="bg-stone-50 p-4 rounded-lg">
                  <p className="text-stone-600">{selectedOrder.notes}</p>
                </div>
              </div>
            )}

            {/* Rejection Reason */}
            {selectedOrder.status === "rejected" &&
              selectedOrder.admin_notes && (
                <div>
                  <h4 className="font-semibold text-red-700 mb-3">
                    ⚠️ Rejection Reason
                  </h4>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-red-700">{selectedOrder.admin_notes}</p>
                  </div>
                </div>
              )}
          </div>
        )}
      </Modal>

      <Footer />
    </>
  );
};

export default MyPurchases;
