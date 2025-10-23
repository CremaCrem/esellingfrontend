import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { apiService } from "../services/api";
import type { CartItem } from "../services/api";

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  isLoading: boolean;
  addToCart: (productId: number, quantity: number) => Promise<boolean>;
  updateCartItem: (id: number, quantity: number) => Promise<boolean>;
  removeFromCart: (id: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const fetchCart = async () => {
    try {
      const response = await apiService.getCart();
      if (response.success && response.data) {
        setCartItems(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    }
  };

  const addToCart = async (
    productId: number,
    quantity: number
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiService.addToCart(productId, quantity);
      if (response.success) {
        await fetchCart(); // Refresh cart after adding
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to add to cart:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCartItem = async (
    id: number,
    quantity: number
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiService.updateCartItem(id, quantity);
      if (response.success) {
        await fetchCart(); // Refresh cart after updating
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update cart item:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (id: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiService.removeFromCart(id);
      if (response.success) {
        await fetchCart(); // Refresh cart after removing
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiService.clearCart();
      if (response.success) {
        await fetchCart(); // Refresh cart after clearing
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to clear cart:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  // Initialize cart on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const value: CartContextType = {
    cartItems,
    cartCount,
    isLoading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
