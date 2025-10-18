import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

/**
 * Hook to handle cart synchronization between localStorage and database
 * based on authentication state
 */
export const useCartSync = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { loadCartFromDB, mergeLocalStorageToDB, switchToLocalStorage } =
    useCartStore();

  useEffect(() => {
    if (isLoading) return; // Don't sync while auth is loading

    if (isAuthenticated) {
      // User is logged in - load cart from DB
      loadCartFromDB();
    } else {
      // User is logged out - switch to localStorage
      switchToLocalStorage();
    }
  }, [isAuthenticated, isLoading, loadCartFromDB, switchToLocalStorage]);

  return {
    // Expose methods for manual cart operations
    mergeLocalStorageToDB,
  };
};
