import { create } from "zustand";
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
  isLoading: boolean;
  isUpdating: boolean; // For individual operations

  // Actions
  addItem: (item: Omit<CartItem, "quantity">) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  setRestaurant: (restaurantId: string) => void;
  getItemQuantity: (itemId: string) => number;
  getTotalItems: () => number;
  getUniqueItemsCount: () => number;

  // Hybrid cart actions
  loadCartFromDB: () => Promise<void>;
  saveCartToDB: () => Promise<void>;
  mergeLocalStorageToDB: () => Promise<void>;
  switchToLocalStorage: () => void;
  setLoading: (loading: boolean) => void;
  setUpdating: (updating: boolean) => void;
}

const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

const calculateTotal = (subtotal: number): number => {
  return subtotal; // Remove delivery fee from cart total
};

export const useCartStore = create<CartStore>()((set, get) => ({
  // Initial state
  items: [],
  restaurantId: undefined,
  subtotal: 0,
  deliveryFee: 0,
  total: 0,
  isLoading: true,
  isUpdating: false,

  // Actions
  addItem: async (item) => {
    set((state) => {
      // Check if adding item from different restaurant
      if (state.restaurantId && state.restaurantId !== item.restaurantId) {
        console.warn("Cannot add items from different restaurant");
        // Option 1: Prevent adding
        return state;
        // Option 2: Clear cart and add new item (uncomment below)
        // return {
        //   items: [{ ...item, quantity: 1 }],
        //   restaurantId: item.restaurantId,
        //   subtotal: item.price,
        //   deliveryFee: 0,
        //   total: item.price,
        // };
      }

      const existingItem = state.items.find((i) => i.itemId === item.itemId);

      if (existingItem) {
        // Update quantity if item already exists
        const updatedItems = state.items.map((i) =>
          i.itemId === item.itemId ? { ...i, quantity: i.quantity + 1 } : i
        );
        const subtotal = calculateSubtotal(updatedItems);
        const total = calculateTotal(subtotal);

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
        const total = calculateTotal(subtotal);

        return {
          items: updatedItems,
          restaurantId: item.restaurantId, // Set restaurantId when adding first item
          subtotal,
          total,
        };
      }
    });

    // Save to DB after state is updated
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      try {
        await get().saveCartToDB();
      } catch (error) {
        console.error("Failed to save cart to DB:", error);
      }
    } else {
      saveCartToLocalStorage();
    }
  },

  removeItem: async (itemId) => {
    set((state) => {
      const updatedItems = state.items.filter((item) => item.itemId !== itemId);
      const subtotal = calculateSubtotal(updatedItems);
      const total = calculateTotal(subtotal);

      const newState = {
        items: updatedItems,
        subtotal,
        total,
        // Clear restaurant if no items left
        restaurantId:
          updatedItems.length === 0 ? undefined : state.restaurantId,
      };

      return newState;
    });

    // Save to DB if logged in
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      try {
        await get().saveCartToDB();
      } catch (error) {
        console.error("Failed to save cart to DB:", error);
      }
    }
  },

  updateQuantity: async (itemId, quantity) => {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      await get().removeItem(itemId);
      return;
    }

    set((state) => {
      const updatedItems = state.items.map((item) =>
        item.itemId === itemId ? { ...item, quantity } : item
      );
      const subtotal = calculateSubtotal(updatedItems);
      const total = calculateTotal(subtotal);

      const newState = {
        items: updatedItems,
        subtotal,
        total,
      };

      return newState;
    });

    // Save to DB if logged in
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      try {
        await get().saveCartToDB();
      } catch (error) {
        console.error("Failed to save cart to DB:", error);
      }
    }
  },

  clearCart: async () => {
    set({
      items: [],
      restaurantId: undefined,
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
    });

    // Save to DB if logged in, localStorage if guest
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      try {
        await get().saveCartToDB();
      } catch (error) {
        console.error("Failed to save cart to DB:", error);
      }
    } else {
      saveCartToLocalStorage();
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

  getUniqueItemsCount: () => {
    return get().items.length;
  },

  // Hybrid cart methods
  loadCartFromDB: async () => {
    try {
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) {
        set({ isLoading: false });
        return;
      }

      set({ isLoading: true });

      // 1. Fetch cart items (itemId + quantity only)
      const response = await userApi.getCart();
      const cartItems = response.items;

      if (cartItems.length === 0) {
        set({
          items: [],
          restaurantId: undefined,
          subtotal: 0,
          deliveryFee: 0,
          total: 0,
          isLoading: false,
        });
        return;
      }

      // 2. Fetch first menu item to get restaurantId
      const { restaurantApi } = await import("@/services");
      const firstMenuItem = await restaurantApi.getMenuItem(
        cartItems[0].itemId
      );
      const restaurantId = firstMenuItem.restaurantId;

      // 3. Fetch full menu to get all item details
      const menuItems = await restaurantApi.getRestaurantMenu(restaurantId);

      // 4. Build full cart items with prices
      // Keep unavailable items but mark them
      const fullCartItems = cartItems.map((cartItem) => {
        const menuItem = menuItems.find((m) => m.itemId === cartItem.itemId);
        if (!menuItem) {
          // Item no longer exists - mark as unavailable
          return {
            itemId: cartItem.itemId,
            restaurantId: restaurantId,
            name: "Item no longer available",
            price: 0,
            quantity: cartItem.quantity,
            isAvailable: false, // Mark as unavailable
          };
        }

        return {
          itemId: cartItem.itemId,
          restaurantId: menuItem.restaurantId,
          name: menuItem.name,
          price: menuItem.price,
          quantity: cartItem.quantity,
          isAvailable: menuItem.isAvailable, // Use menu item availability
        };
      });

      // 5. Calculate totals (only count available items)
      const availableItems = fullCartItems.filter((item) => item.isAvailable);
      const subtotal = availableItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const deliveryFee = 0; // No delivery fee in cart
      const total = subtotal; // Total equals subtotal (no delivery fee)

      set({
        items: fullCartItems, // Include unavailable items
        restaurantId,
        subtotal,
        deliveryFee,
        total,
        isLoading: false,
      });

      // Show warning if any items are unavailable
      const unavailableCount = fullCartItems.filter(
        (item) => !item.isAvailable
      ).length;
      if (unavailableCount > 0) {
        console.warn(
          `${unavailableCount} item(s) in cart are no longer available`
        );
      }
    } catch (error) {
      console.error("Failed to load cart from DB:", error);
      set({ isLoading: false });
    }
  },

  saveCartToDB: async () => {
    try {
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) return;

      set({ isUpdating: true });

      const state = get();
      // Send only itemId + quantity to backend
      await userApi.updateCart(
        state.items.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
        }))
      );
    } catch (error) {
      console.error("Failed to save cart to DB:", error);
    } finally {
      set({ isUpdating: false });
    }
  },

  mergeLocalStorageToDB: async () => {
    try {
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) return;

      const state = get();
      if (state.items.length === 0) return;

      // Save current localStorage cart to DB (only itemId + quantity)
      await userApi.updateCart(
        state.items.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
        }))
      );
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

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setUpdating: (updating: boolean) => {
    set({ isUpdating: updating });
  },
}));

// Manual localStorage save for guest users only
export const saveCartToLocalStorage = () => {
  const { isAuthenticated } = useAuthStore.getState();
  if (isAuthenticated) return; // Never save for authenticated users

  const state = useCartStore.getState();
  localStorage.setItem(
    "food-delivery-cart",
    JSON.stringify({
      items: state.items,
      restaurantId: state.restaurantId,
    })
  );
};

// Manual localStorage load for guest users only
export const loadCartFromLocalStorage = () => {
  const { isAuthenticated } = useAuthStore.getState();
  if (isAuthenticated) return; // Never load for authenticated users

  const stored = localStorage.getItem("food-delivery-cart");
  if (stored) {
    try {
      const { items, restaurantId } = JSON.parse(stored);
      if (items) {
        const subtotal = calculateSubtotal(items);
        const total = calculateTotal(subtotal);
        useCartStore.setState({
          items,
          restaurantId,
          subtotal,
          total,
          deliveryFee: 0,
        });
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
    }
  }
};
