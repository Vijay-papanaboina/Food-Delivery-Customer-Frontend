import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { authApi } from "@/services";
import { logger } from "@/lib/logger";

/**
 * Hook to initialize authentication state on app load
 * Checks if user is still authenticated using stored tokens
 */
export const useAuthInit = () => {
  const { setLoading } = useAuthStore();
  const { loadCartFromDB, setLoading: setCartLoading } = useCartStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return; // Prevent double execution in StrictMode
    hasInitialized.current = true;
    const initializeAuth = async () => {
      setLoading(true);

      try {
        const authResult = await authApi.checkAuth();

        if (authResult.isAuthenticated && authResult.user) {
          // Load cart from database for authenticated user
          await loadCartFromDB();
        } else {
          // For guest users, set cart loading to false
          setCartLoading(false);
        }
      } catch (error) {
        logger.error("[useAuthInit] Auth initialization failed", { error });
        setCartLoading(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};
