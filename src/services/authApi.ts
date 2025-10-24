import { config } from "@/config/env";
import { useAuthStore } from "@/store/authStore";
import { logger } from "@/lib/logger";
import type { User } from "@/types";
import type { BackendUser } from "@/types/api";
import { ApiService } from "./baseApi";

// Auth API
export class AuthApi extends ApiService {
  constructor() {
    super(config.userApiUrl, true); // Enable credentials for auth service
  }

  signup = async (userData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<{
    message: string;
    user: User;
    accessToken: string;
  }> => {
    const result = await this.post<{
      message: string;
      user: BackendUser;
      accessToken: string;
    }>("/api/user-service/auth/signup", userData);

    // Transform BackendUser to User
    const user: User = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      phone: result.user.phone,
      isActive: result.user.is_active,
      createdAt: result.user.created_at,
      updatedAt: result.user.updated_at,
    };

    return {
      message: result.message,
      user,
      accessToken: result.accessToken,
    };
  };

  login = async (credentials: {
    email: string;
    password: string;
  }): Promise<{
    message: string;
    user: User;
    accessToken: string;
  }> => {
    const result = await this.post<{
      message: string;
      user: BackendUser;
      accessToken: string;
    }>("/api/user-service/auth/login/customer", credentials);

    // Transform BackendUser to User
    const user: User = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      phone: result.user.phone,
      isActive: result.user.is_active,
      createdAt: result.user.created_at,
      updatedAt: result.user.updated_at,
    };

    return {
      message: result.message,
      user,
      accessToken: result.accessToken,
    };
  };

  refreshToken = async (): Promise<{
    message: string;
    accessToken: string;
    user: BackendUser;
  }> => {
    return this.request({
      method: "POST",
      url: "/api/user-service/auth/refresh",
      _skipAuthRefresh: true,
    });
  };

  validateToken = async (): Promise<{ message: string; user: BackendUser }> => {
    return this.request({
      method: "POST",
      url: "/api/user-service/auth/validate",
      _skipAuthRefresh: true,
    });
  };

  private handleRefreshResponse = (refreshResponse: {
    accessToken: string;
    user: BackendUser;
  }): { isAuthenticated: boolean; user: User } => {
    // Transform BackendUser to User
    const user: User = {
      id: refreshResponse.user.id,
      name: refreshResponse.user.name,
      email: refreshResponse.user.email,
      phone: refreshResponse.user.phone,
      isActive: refreshResponse.user.is_active,
      createdAt: refreshResponse.user.created_at,
      updatedAt: refreshResponse.user.updated_at,
    };

    // Store new token in localStorage and update Zustand
    localStorage.setItem("access_token", refreshResponse.accessToken);
    useAuthStore.getState().login(user, refreshResponse.accessToken);

    return { isAuthenticated: true, user };
  };

  checkAuth = async (): Promise<{ isAuthenticated: boolean; user?: User }> => {
    try {
      // Step 1: Check localStorage for access token
      const storedToken = localStorage.getItem("access_token");

      if (storedToken) {
        // Step 2: Validate the token
        try {
          const validateResponse = await this.validateToken();

          // Transform BackendUser to User
          const user: User = {
            id: validateResponse.user.id,
            name: validateResponse.user.name,
            email: validateResponse.user.email,
            phone: validateResponse.user.phone,
            isActive: validateResponse.user.is_active,
            createdAt: validateResponse.user.created_at,
            updatedAt: validateResponse.user.updated_at,
          };

          // Update user in Zustand store
          useAuthStore.getState().login(user, storedToken);
          return { isAuthenticated: true, user };
        } catch (validateError) {
          // Step 3: Token validation failed, try to refresh
          logger.warn(`[AuthAPI] Token validation failed, attempting refresh`, {
            error: validateError,
          });

          try {
            const refreshResponse = await this.refreshToken();
            return this.handleRefreshResponse(refreshResponse);
          } catch (error) {
            logger.error(`[AuthAPI] Refresh token failed`, { error });
            // Clear invalid tokens
            localStorage.removeItem("access_token");
            useAuthStore.getState().logout();
            return { isAuthenticated: false };
          }
        }
      }

      // No stored token found, but try to refresh from HTTP-only cookie
      logger.info(
        `[AuthAPI] No stored token found, attempting refresh from cookie`
      );
      try {
        const refreshResponse = await this.refreshToken();
        return this.handleRefreshResponse(refreshResponse);
      } catch (error) {
        logger.error(`[AuthAPI] Refresh token failed`, { error });
        // Clear any invalid tokens
        localStorage.removeItem("access_token");
        useAuthStore.getState().logout();
        return { isAuthenticated: false };
      }
    } catch (error) {
      logger.error(`[AuthAPI] Auth check failed`, { error });
      return { isAuthenticated: false };
    }
  };

  logout = async (): Promise<{ message: string }> => {
    return this.post("/api/user-service/auth/logout");
  };
}
