import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Cart } from "@/types";

interface CartStore extends Cart {
  // Actions
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setRestaurant: (restaurantId: string) => void;
  getItemQuantity: (itemId: string) => number;
  getTotalItems: () => number;
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

            return {
              items: updatedItems,
              subtotal,
              total,
            };
          } else {
            // Add new item
            const newItem = { ...item, quantity: 1 };
            const updatedItems = [...state.items, newItem];
            const subtotal = calculateSubtotal(updatedItems);
            const total = calculateTotal(subtotal, state.deliveryFee);

            return {
              items: updatedItems,
              subtotal,
              total,
            };
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

          return {
            items: updatedItems,
            subtotal,
            total,
            // Clear restaurant if no items left
            restaurantId:
              updatedItems.length === 0 ? undefined : state.restaurantId,
          };
        });
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            // Remove item if quantity is 0 or negative
            return get().removeItem(itemId);
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
      },

      clearCart: () => {
        set({
          items: [],
          restaurantId: undefined,
          subtotal: 0,
          deliveryFee: 0,
          total: 0,
        });
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
    }),
    {
      name: "food-delivery-cart",
      // Only persist cart items and restaurant ID
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
      }),
    }
  )
);
