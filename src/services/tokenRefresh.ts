import { useAuthStore } from "@/store/authStore";
import { logger } from "@/lib/logger";

export const refreshAccessToken = async (): Promise<string> => {
  try {
    // Dynamic import to avoid circular dependency
    const { AuthApi } = await import("./authApi");
    const authApi = new AuthApi();
    const refreshResponse = await authApi.refreshToken();

    // Update the stored access token
    useAuthStore
      .getState()
      .login(useAuthStore.getState().user!, refreshResponse.accessToken);

    return refreshResponse.accessToken;
  } catch (error) {
    logger.error(`[TokenRefresh] Token refresh failed`, { error });
    throw error;
  }
};
