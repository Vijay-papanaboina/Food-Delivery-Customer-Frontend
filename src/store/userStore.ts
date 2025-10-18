import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, DeliveryAddress } from "@/types";
import { config } from "@/config/env";

interface UserStore extends User {
  // Actions
  setUser: (user: Partial<User>) => void;
  setDefaultAddress: (address: DeliveryAddress) => void;
  clearUser: () => void;
}

const defaultUser: User = {
  userId: config.userId,
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+1-555-0123",
  defaultAddress: {
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
  },
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      // Initial state
      ...defaultUser,

      // Actions
      setUser: (user) => {
        set((state) => ({
          ...state,
          ...user,
        }));
      },

      setDefaultAddress: (address) => {
        set((state) => ({
          ...state,
          defaultAddress: address,
        }));
      },

      clearUser: () => {
        set(defaultUser);
      },
    }),
    {
      name: "food-delivery-user",
      // Persist all user data
      partialize: (state) => ({
        userId: state.userId,
        name: state.name,
        email: state.email,
        phone: state.phone,
        defaultAddress: state.defaultAddress,
      }),
    }
  )
);
