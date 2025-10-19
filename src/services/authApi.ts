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
    }>("/api/auth/signup", userData);

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
    }>("/api/auth/login", credentials);

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
    return this.post("/api/auth/refresh");
  };

  validateToken = async (): Promise<{ message: string; user: BackendUser }> => {
    return this.post("/api/auth/validate");
  };

  checkAuth = async (): Promise<{ isAuthenticated: boolean; user?: User }> => {
    try {
      // Always try to refresh token from cookies
      try {
        const refreshResponse = await this.refreshToken();

        // Use user data from refresh response (not from JWT)
        try {
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

          useAuthStore.getState().login(user, refreshResponse.accessToken);
          return { isAuthenticated: true, user };
        } catch (error) {
          logger.error(
            `[AuthAPI] Failed to process user data from refresh response`,
            {
              error,
            }
          );
          return { isAuthenticated: false };
        }
      } catch (error) {
        logger.error(`[AuthAPI] Refresh token failed`, { error });
        return { isAuthenticated: false };
      }
    } catch (error) {
      logger.error(`[AuthAPI] Auth check failed`, { error });
      return { isAuthenticated: false };
    }
  };
}
