import { create } from "zustand";
import { userApi } from "@/services";
import type { CartItem } from "@/types";

interface DbCartStore {
  // Cart properties
  items: CartItem[];
  restaurantId?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;

  // Additional state
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCart: () => Promise<void>;
  addItem: (item: Omit<CartItem, "quantity">) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  setRestaurant: (restaurantId: string) => Promise<void>;
  getItemQuantity: (itemId: string) => number;
  getTotalItems: () => number;
  syncCart: () => Promise<void>;
}

const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

const calculateTotal = (subtotal: number, deliveryFee: number): number => {
  return subtotal + deliveryFee;
};

export const useDbCartStore = create<DbCartStore>((set, get) => ({
  // Initial state
  items: [],
  restaurantId: undefined,
  subtotal: 0,
  deliveryFee: 0,
  total: 0,
  isLoading: false,
  error: null,

  // Load cart from database
  loadCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await userApi.getCart();
      const cart = response.cart;

      set({
        items: cart.items || [],
        restaurantId: cart.restaurantId || undefined,
        subtotal: cart.subtotal || 0,
        deliveryFee: cart.deliveryFee || 0,
        total: cart.total || 0,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error("Error loading cart:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error || "Failed to load cart"
          : "Failed to load cart";
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  // Sync current state to database
  syncCart: async () => {
    const state = get();
    if (!state.restaurantId || state.items.length === 0) return;

    try {
      await userApi.updateCart({
        restaurantId: state.restaurantId,
        items: state.items,
        subtotal: state.subtotal,
        deliveryFee: state.deliveryFee,
        total: state.total,
      });
    } catch (error: unknown) {
      console.error("Error syncing cart:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error || "Failed to sync cart"
          : "Failed to sync cart";
      set({ error: errorMessage });
    }
  },

  // Add item to cart
  addItem: async (item) => {
    set((state) => {
      const existingItem = state.items.find((i) => i.itemId === item.itemId);

      let updatedItems: CartItem[];
      if (existingItem) {
        updatedItems = state.items.map((i) =>
          i.itemId === item.itemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        updatedItems = [...state.items, { ...item, quantity: 1 }];
      }

      const subtotal = calculateSubtotal(updatedItems);
      const total = calculateTotal(subtotal, state.deliveryFee);

      return {
        items: updatedItems,
        subtotal,
        total,
      };
    });

    // Sync to database
    await get().syncCart();
  },

  // Remove item from cart
  removeItem: async (itemId) => {
    set((state) => {
      const updatedItems = state.items.filter((item) => item.itemId !== itemId);
      const subtotal = calculateSubtotal(updatedItems);
      const total = calculateTotal(subtotal, state.deliveryFee);

      return {
        items: updatedItems,
        subtotal,
        total,
        restaurantId:
          updatedItems.length === 0 ? undefined : state.restaurantId,
      };
    });

    // Sync to database
    await get().syncCart();
  },

  // Update item quantity
  updateQuantity: async (itemId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        const updatedItems = state.items.filter(
          (item) => item.itemId !== itemId
        );
        const subtotal = calculateSubtotal(updatedItems);
        const total = calculateTotal(subtotal, state.deliveryFee);

        return {
          items: updatedItems,
          subtotal,
          total,
          restaurantId:
            updatedItems.length === 0 ? undefined : state.restaurantId,
        };
      }

      const updatedItems = state.items.map((item) =>
        item.itemId === itemId ? { ...item, quantity } : item
      );
      const subtotal = calculateSubtotal(updatedItems);
      const total = calculateTotal(subtotal, state.deliveryFee);

      return {
        items: updatedItems,
        subtotal,
        total,
      };
    });

    // Sync to database
    await get().syncCart();
  },

  // Clear cart
  clearCart: async () => {
    set({
      items: [],
      restaurantId: undefined,
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
    });

    // Clear from database
    try {
      await userApi.updateCart({
        restaurantId: "",
        items: [],
        subtotal: 0,
        deliveryFee: 0,
        total: 0,
      });
    } catch (error: unknown) {
      console.error("Error clearing cart:", error);
      const errorMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error || "Failed to clear cart"
          : "Failed to clear cart";
      set({ error: errorMessage });
    }
  },

  // Set restaurant
  setRestaurant: async (restaurantId) => {
    set((state) => {
      // If changing restaurant, clear cart first
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        return {
          items: [],
          restaurantId,
          subtotal: 0,
          deliveryFee: 0,
          total: 0,
        };
      }

      return { restaurantId };
    });

    // Sync to database
    await get().syncCart();
  },

  // Helper methods
  getItemQuantity: (itemId) => {
    const item = get().items.find((i) => i.itemId === itemId);
    return item?.quantity || 0;
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },
}));
