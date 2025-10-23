import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useCart } from "../contexts/CartContext";
import { apiService, getAssetUrl } from "../services/api";
import type { CartItem, GcashSettings } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import Footer from "../components/Footer";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Package,
  AlertCircle,
  QrCode,
  Upload,
} from "lucide-react";
import Toast from "../components/Toast";

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("cop");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    type: "success" as "success" | "error",
    isVisible: false,
  });

  // GCash payment state
  const [gcashSettings, setGcashSettings] = useState<GcashSettings>({});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isLoadingGcash, setIsLoadingGcash] = useState(false);

  useEffect(() => {
    // If no items in cart, redirect to cart page
    if (cartItems.length === 0) {
      navigate("/cart");
    } else {
      // Initially select all items
      setSelectedItems(cartItems);
    }
  }, [cartItems, navigate]);

  // Fetch GCash settings when GCash is selected
  useEffect(() => {
    if (paymentMethod === "gcash") {
      fetchGcashSettings();
    }
  }, [paymentMethod]);

  const fetchGcashSettings = async () => {
    setIsLoadingGcash(true);
    try {
      const data = await apiService.getGcashSettings();
      if (data.success && data.data) {
        setGcashSettings(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch GCash settings:", error);
      showToast("Failed to load GCash settings", "error");
    } finally {
      setIsLoadingGcash(false);
    }
  };

  const toggleItemSelection = (item: CartItem) => {
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
  };

  const selectAllItems = () => {
    setSelectedItems(cartItems);
  };

  const deselectAllItems = () => {
    setSelectedItems([]);
  };

  const groupItemsBySeller = (items: CartItem[]) => {
    const grouped = items.reduce((acc, item) => {
      const sellerId = item.product.seller?.id || 0;
      const sellerName = item.product.seller?.shop_name || "Unknown Seller";

      if (!acc[sellerId]) {
        acc[sellerId] = {
          seller: { id: sellerId, name: sellerName },
          items: [],
        };
      }
      acc[sellerId].items.push(item);
      return acc;
    }, {} as Record<number, { seller: { id: number; name: string }; items: CartItem[] }>);

    return Object.values(grouped);
  };

  const calculateSubtotal = (items: CartItem[]) => {
    return items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal(selectedItems);
    return subtotal;
  };

  const handlePlaceOrder = async () => {
    if (selectedItems.length === 0) {
      showToast("Please select at least one item to order", "error");
      return;
    }

    if (!paymentMethod) {
      showToast("Please select a payment method", "error");
      return;
    }

    // Validate GCash payment
    if (paymentMethod === "gcash" && !receiptFile) {
      showToast("Please upload a payment receipt for GCash payment", "error");
      return;
    }

    setIsLoading(true);
    try {
      const orderItems = selectedItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      let response;
      if (paymentMethod === "gcash" && receiptFile) {
        response = await apiService.createOrderWithReceipt(
          orderItems,
          paymentMethod,
          notes,
          receiptFile
        );
      } else {
        response = await apiService.createOrder(
          orderItems,
          paymentMethod,
          notes
        );
      }

      if (response.success) {
        showToast(
          response.data?.message || "Order placed successfully!",
          "success"
        );

        // Clear selected items from cart
        await clearCart();

        // Navigate to purchases page after a short delay
        setTimeout(() => {
          navigate("/my-purchases");
        }, 2000);
      }
    } catch (error: any) {
      showToast(error.message || "Failed to place order", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, isVisible: true });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              No items in cart
            </h1>
            <p className="text-gray-600 mb-8">
              Add some items to your cart first.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const groupedItems = groupItemsBySeller(selectedItems);
  const subtotal = calculateSubtotal(selectedItems);
  const total = calculateTotal();

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
        duration={3000}
      />

      <div className="min-h-screen bg-emerald-50/40">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate("/cart")}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5 text-stone-600" />
            </button>
            <h1 className="text-3xl font-bold text-stone-800">Checkout</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Item Selection */}
              <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-stone-800">
                    Select Items to Order
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllItems}
                      className="text-sm text-amber-600 hover:text-amber-700"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={deselectAllItems}
                      className="text-sm text-amber-600 hover:text-amber-700"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {groupItemsBySeller(cartItems).map((group) => (
                  <div key={group.seller.id} className="mb-6 last:mb-0">
                    <h3 className="font-medium text-emerald-900 mb-3">
                      {group.seller.name}
                    </h3>
                    <div className="space-y-3">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border ${
                            selectedItems.some((i) => i.id === item.id)
                              ? "border-amber-300 bg-amber-50"
                              : "border-gray-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.some(
                              (i) => i.id === item.id
                            )}
                            onChange={() => toggleItemSelection(item)}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                          <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.product.main_image_url ? (
                              <img
                                src={getAssetUrl(item.product.main_image_url)}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  const fallback =
                                    target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{
                                display: item.product.main_image_url
                                  ? "none"
                                  : "flex",
                              }}
                            >
                              <span className="text-xs text-stone-600">
                                IMG
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-stone-800 line-clamp-1">
                              {item.product.name}
                            </h4>
                            <p className="text-sm text-stone-600">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-stone-800">
                              ₱
                              {(
                                item.product.price * item.quantity
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {selectedItems.length > 0 && groupedItems.length > 1 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">
                          Your order will be split into {groupedItems.length}{" "}
                          separate orders
                        </p>
                        <p className="mt-1">
                          Each seller will ship their items separately and
                          you'll receive individual tracking numbers.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pickup Information */}
              <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-stone-800">
                    Pickup Information
                  </h2>
                  <button
                    onClick={() => navigate("/my-account")}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    Edit Contact Info
                  </button>
                </div>

                {user?.contact_number ? (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-amber-600 mt-1" />
                    <div>
                      <p className="font-medium text-stone-800">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-stone-700">{user.contact_number}</p>
                      <p className="text-sm text-stone-600 mt-1">
                        Products will be available for pickup at the
                        university's designated location.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">
                      Please set your contact number in your account settings
                      for pickup coordination.
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
                <h2 className="text-xl font-semibold text-emerald-900 mb-4">
                  Payment Method
                </h2>
                <div className="space-y-3">
                  {[
                    { value: "cop", label: "Cash on Pickup (COP)" },
                    { value: "gcash", label: "GCash" },
                    { value: "paymaya", label: "PayMaya" },
                    { value: "bank_transfer", label: "Bank Transfer" },
                  ].map((method) => (
                    <label
                      key={method.value}
                      className="flex items-center space-x-3"
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-amber-600"
                      />
                      <CreditCard className="h-5 w-5 text-amber-600" />
                      <span className="text-stone-800">{method.label}</span>
                    </label>
                  ))}
                </div>

                {/* GCash QR Code and Receipt Upload */}
                {paymentMethod === "gcash" && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
                      <QrCode className="w-5 h-5 mr-2" />
                      GCash Payment Instructions
                    </h3>

                    {isLoadingGcash ? (
                      <div className="text-center py-4">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-blue-600">
                          Loading GCash settings...
                        </p>
                      </div>
                    ) : gcashSettings.gcash_qr_url ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-blue-700 mb-3">
                            Scan this QR code with your GCash app to pay:
                          </p>
                          <div className="inline-block p-4 bg-white rounded-lg border border-blue-200">
                            <img
                              src={getAssetUrl(gcashSettings.gcash_qr_url)}
                              alt="GCash QR Code"
                              className="w-48 h-48 object-contain"
                            />
                          </div>
                          {gcashSettings.gcash_number && (
                            <p className="text-sm text-blue-600 mt-2">
                              GCash Number: {gcashSettings.gcash_number}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-blue-800 mb-2">
                            Upload Payment Receipt *
                          </label>
                          <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setReceiptFile(e.target.files?.[0] || null)
                              }
                              className="hidden"
                              id="receipt-upload"
                            />
                            <label
                              htmlFor="receipt-upload"
                              className="cursor-pointer block"
                            >
                              {receiptFile ? (
                                <div className="space-y-2">
                                  <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                                    <Upload className="w-6 h-6 text-green-600" />
                                  </div>
                                  <p className="text-sm font-medium text-green-600">
                                    {receiptFile.name}
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                                    <Upload className="w-6 h-6 text-blue-400" />
                                  </div>
                                  <p className="text-sm font-medium text-blue-700">
                                    Upload Receipt Screenshot
                                  </p>
                                  <p className="text-xs text-blue-600">
                                    Take a screenshot of your GCash payment
                                    confirmation
                                  </p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                        <p className="text-orange-700">
                          GCash QR code not available. Please contact admin.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
                <h2 className="text-xl font-semibold text-emerald-900 mb-4">
                  Order Notes (Optional)
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions for your order..."
                  className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 sticky top-32">
                <h2 className="text-xl font-semibold text-emerald-900 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal ({selectedItems.length} items)</span>
                    <span>₱{subtotal.toLocaleString()}</span>
                  </div>
                  {/* Shipping and Tax removed for pickup-only flow */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-bold text-stone-800">
                      <span>Total</span>
                      <span>₱{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    isLoading ||
                    selectedItems.length === 0 ||
                    !user?.contact_number
                  }
                  className="w-full px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Placing Order..." : "Place Order"}
                </button>

                <button
                  onClick={() => navigate("/cart")}
                  className="w-full px-6 py-3 border border-stone-300 text-stone-800 rounded-lg hover:bg-stone-50 transition-colors font-medium mt-4"
                >
                  Back to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Checkout;
