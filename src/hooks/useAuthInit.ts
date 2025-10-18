import { useEffect } from "react";
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
  const { loadCartFromDB } = useCartStore();

  useEffect(() => {
    const initializeAuth = async () => {
      console.log("[useAuthInit] Starting auth initialization");
      setLoading(true);

      try {
        logger.info("[useAuthInit] Checking authentication status");
        logger.info("[useAuthInit] Current auth state before checkAuth:", {
          isAuthenticated: useAuthStore.getState().isAuthenticated,
          hasAccessToken: !!useAuthStore.getState().accessToken,
          hasUser: !!useAuthStore.getState().user,
        });

        const authResult = await authApi.checkAuth();

        logger.info("[useAuthInit] checkAuth result:", authResult);

        if (authResult.isAuthenticated && authResult.user) {
          logger.info("[useAuthInit] User is authenticated", {
            userId: authResult.user.id,
            email: authResult.user.email,
            name: authResult.user.name,
          });
          logger.info("[useAuthInit] Auth state after checkAuth:", {
            isAuthenticated: useAuthStore.getState().isAuthenticated,
            hasAccessToken: !!useAuthStore.getState().accessToken,
            hasUser: !!useAuthStore.getState().user,
          });

          // Load cart from database for authenticated user
          logger.info("[useAuthInit] Loading cart from database");
          await loadCartFromDB();
        } else {
          logger.info("[useAuthInit] User is not authenticated");
        }
      } catch (error) {
        logger.error("[useAuthInit] Auth initialization failed", { error });
      } finally {
        console.log("[useAuthInit] Setting loading to false");
        setLoading(false);
      }
    };

    initializeAuth();
  }, [setLoading, loadCartFromDB]);
};
