import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import type { CartItem } from "../services/api";
import { getAssetUrl } from "../services/api";
import Toast from "../components/Toast";
import ConfirmationModal from "../components/ConfirmationModal";
import Footer from "../components/Footer";

const Cart: React.FC = () => {
  const { cartItems, updateCartItem, removeFromCart, isLoading } = useCart();
  const [toast, setToast] = useState({
    message: "",
    type: "success" as "success" | "error" | "warning" | "info",
    isVisible: false,
  });
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<CartItem | null>(null);
  const navigate = useNavigate();

  const updateQuantity = async (item: CartItem, increment: boolean) => {
    const newQuantity = increment
      ? item.quantity + 1
      : Math.max(1, item.quantity - 1);
    const success = await updateCartItem(item.id, newQuantity);

    if (!success) {
      showToast("Failed to update quantity", "error");
    }
  };

  const removeItem = async (id: number) => {
    const success = await removeFromCart(id);
    if (!success) {
      showToast("Failed to remove item", "error");
    }
  };

  const handleRemoveClick = (item: CartItem) => {
    setItemToRemove(item);
    setShowRemoveModal(true);
  };

  const confirmRemove = async () => {
    if (itemToRemove) {
      await removeItem(itemToRemove.id);
      setShowRemoveModal(false);
      setItemToRemove(null);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, isVisible: true });
  };

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  const groupItemsBySeller = () => {
    const grouped = cartItems.reduce((acc, item) => {
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

  if (cartItems.length === 0) {
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
            <div className="text-center">
              <div className="w-24 h-24 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="h-12 w-12 text-stone-400" />
              </div>
              <h1 className="text-2xl font-bold text-stone-800 mb-4">
                Your cart is empty
              </h1>
              <p className="text-stone-600 mb-8">
                Looks like you haven't added any items to your cart yet.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                Start Shopping
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

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
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5 text-stone-600" />
            </button>
            <h1 className="text-3xl font-bold text-stone-800">Shopping Cart</h1>
            <span className="ml-4 text-stone-500">
              ({cartItems.length} items)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-stone-200">
                <div className="p-6 border-b border-stone-200">
                  <h2 className="text-xl font-semibold text-stone-800">
                    Cart Items
                  </h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {groupItemsBySeller().map((group) => (
                    <div key={group.seller.id} className="p-6">
                      <h3 className="font-medium text-stone-800 mb-4">
                        {group.seller.name}
                      </h3>
                      <div className="space-y-4">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start space-x-4"
                          >
                            {/* Product Image */}
                            <div className="w-20 h-20 bg-stone-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                                    if (fallback)
                                      fallback.style.display = "flex";
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

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-medium text-stone-800 mb-2 line-clamp-2">
                                {item.product.name}
                              </h4>
                              <div className="text-lg font-bold text-stone-800">
                                ₱{item.product.price.toLocaleString()}
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => updateQuantity(item, false)}
                                disabled={isLoading}
                                className="w-8 h-8 border border-stone-300 rounded-md flex items-center justify-center hover:bg-stone-50 transition-colors disabled:opacity-50"
                              >
                                <Minus className="h-4 w-4 text-stone-600" />
                              </button>
                              <span className="w-12 text-center text-stone-800 font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item, true)}
                                disabled={isLoading}
                                className="w-8 h-8 border border-stone-300 rounded-md flex items-center justify-center hover:bg-stone-50 transition-colors disabled:opacity-50"
                              >
                                <Plus className="h-4 w-4 text-stone-600" />
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveClick(item)}
                              disabled={isLoading}
                              className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 sticky top-32">
                <h2 className="text-xl font-semibold text-stone-800 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>₱{calculateSubtotal().toLocaleString()}</span>
                  </div>
                  {/* Shipping removed for pickup-only flow */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-bold text-stone-800">
                      <span>Total</span>
                      <span>₱{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  className="w-full px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium mb-4"
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full px-6 py-3 border border-stone-300 text-stone-800 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Item Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false);
          setItemToRemove(null);
        }}
        onConfirm={confirmRemove}
        title="Remove Item"
        message={
          itemToRemove
            ? `Are you sure you want to remove "${itemToRemove.product.name}" from your cart?`
            : ""
        }
        confirmText="Remove"
        cancelText="Keep Item"
        variant="warning"
      />

      <Footer />
    </>
  );
};

export default Cart;
