import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";
import { useAuthStore } from "./authStore";
import { userApi } from "@/services";

interface CartStore {
  // Cart properties
  items: CartItem[];
  restaurantId?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;

  // Actions
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setRestaurant: (restaurantId: string) => void;
  getItemQuantity: (itemId: string) => number;
  getTotalItems: () => number;

  // Hybrid cart actions
  loadCartFromDB: () => Promise<void>;
  saveCartToDB: () => Promise<void>;
  mergeLocalStorageToDB: () => Promise<void>;
  switchToLocalStorage: () => void;
}

const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

const calculateTotal = (subtotal: number, deliveryFee: number): number => {
  return subtotal + deliveryFee;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      restaurantId: undefined,
      subtotal: 0,
      deliveryFee: 0,
      total: 0,

      // Actions
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.itemId === item.itemId
          );

          if (existingItem) {
            // Update quantity if item already exists
            const updatedItems = state.items.map((i) =>
              i.itemId === item.itemId ? { ...i, quantity: i.quantity + 1 } : i
            );
            const subtotal = calculateSubtotal(updatedItems);
            const total = calculateTotal(subtotal, state.deliveryFee);

            const newState = {
              items: updatedItems,
              subtotal,
              total,
            };

            // Save to DB if logged in
            const { isAuthenticated } = useAuthStore.getState();
            if (isAuthenticated) {
              setTimeout(() => get().saveCartToDB(), 0);
            }

            return newState;
          } else {
            // Add new item
            const newItem = { ...item, quantity: 1 };
            const updatedItems = [...state.items, newItem];
            const subtotal = calculateSubtotal(updatedItems);
            const total = calculateTotal(subtotal, state.deliveryFee);

            const newState = {
              items: updatedItems,
              restaurantId: item.restaurantId, // Set restaurantId when adding first item
              subtotal,
              total,
            };

            // Save to DB if logged in
            const { isAuthenticated } = useAuthStore.getState();
            if (isAuthenticated) {
              setTimeout(() => get().saveCartToDB(), 0);
            }

            return newState;
          }
        });
      },

      removeItem: (itemId) => {
        set((state) => {
          const updatedItems = state.items.filter(
            (item) => item.itemId !== itemId
          );
          const subtotal = calculateSubtotal(updatedItems);
          const total = calculateTotal(subtotal, state.deliveryFee);

          const newState = {
            items: updatedItems,
            subtotal,
            total,
            // Clear restaurant if no items left
            restaurantId:
              updatedItems.length === 0 ? undefined : state.restaurantId,
          };

          // Save to DB if logged in
          const { isAuthenticated } = useAuthStore.getState();
          if (isAuthenticated) {
            setTimeout(() => get().saveCartToDB(), 0);
          }

          return newState;
        });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or negative
          get().removeItem(itemId);
          return;
        }

        set((state) => {
          const updatedItems = state.items.map((item) =>
            item.itemId === itemId ? { ...item, quantity } : item
          );
          const subtotal = calculateSubtotal(updatedItems);
          const total = calculateTotal(subtotal, state.deliveryFee);

          const newState = {
            items: updatedItems,
            subtotal,
            total,
          };

          // Save to DB if logged in
          const { isAuthenticated } = useAuthStore.getState();
          if (isAuthenticated) {
            setTimeout(() => get().saveCartToDB(), 0);
          }

          return newState;
        });
      },

      clearCart: () => {
        set({
          items: [],
          restaurantId: undefined,
          subtotal: 0,
          deliveryFee: 0,
          total: 0,
        });

        // Save to DB if logged in
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          setTimeout(() => get().saveCartToDB(), 0);
        }
      },

      setRestaurant: (restaurantId) => {
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
      },

      getItemQuantity: (itemId) => {
        const item = get().items.find((i) => i.itemId === itemId);
        return item?.quantity || 0;
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // Hybrid cart methods
      loadCartFromDB: async () => {
        try {
          const { isAuthenticated } = useAuthStore.getState();
          if (!isAuthenticated) return;

          const response = await userApi.getCart();
          const dbCart = response.cart;

          set({
            items: dbCart.items,
            restaurantId: dbCart.restaurantId,
            subtotal: dbCart.subtotal,
            deliveryFee: dbCart.deliveryFee,
            total: dbCart.total,
          });
        } catch (error) {
          console.error("Failed to load cart from DB:", error);
        }
      },

      saveCartToDB: async () => {
        try {
          const { isAuthenticated } = useAuthStore.getState();
          if (!isAuthenticated) return;

          const state = get();
          await userApi.updateCart({
            restaurantId: state.restaurantId || "",
            items: state.items,
            subtotal: state.subtotal,
            deliveryFee: state.deliveryFee,
            total: state.total,
          });
        } catch (error) {
          console.error("Failed to save cart to DB:", error);
        }
      },

      mergeLocalStorageToDB: async () => {
        try {
          const { isAuthenticated } = useAuthStore.getState();
          if (!isAuthenticated) return;

          const state = get();
          if (state.items.length === 0) return;

          // Save current localStorage cart to DB
          await userApi.updateCart({
            restaurantId: state.restaurantId || "",
            items: state.items,
            subtotal: state.subtotal,
            deliveryFee: state.deliveryFee,
            total: state.total,
          });
        } catch (error) {
          console.error("Failed to merge cart to DB:", error);
        }
      },

      switchToLocalStorage: () => {
        // Just clear the current cart, localStorage will be used via persist
        set({
          items: [],
          restaurantId: undefined,
          subtotal: 0,
          deliveryFee: 0,
          total: 0,
        });
      },
    }),
    {
      name: "food-delivery-cart",
      // Only persist cart items and restaurant ID for localStorage
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
      }),
    }
  )
);
