import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/authStore";
import { logger, sanitizeForLogging } from "@/lib/logger";

// Base API class
export class ApiService {
  protected api: AxiosInstance;

  constructor(baseUrl: string, withCredentials = false) {
    this.api = axios.create({
      baseURL: baseUrl,
      withCredentials, // Only include cookies when needed
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include JWT token
    this.api.interceptors.request.use((config) => {
      const { accessToken } = useAuthStore.getState();

      // Try Zustand store first, then localStorage fallback
      const token = accessToken || localStorage.getItem("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        logger.warn(
          `[API] No JWT token available for ${config.method?.toUpperCase()} ${
            config.url
          }`
        );
      }
      return config;
    });

    // Add response interceptor for error handling and token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest._skipAuthRefresh
        ) {
          originalRequest._retry = true;

          logger.warn(`[API] 401 Unauthorized - attempting token refresh`, {
            endpoint: error.config?.url,
            method: error.config?.method,
          });

          try {
            // Try to refresh the token (refresh token is in cookies)
            const { refreshAccessToken } = await import("./tokenRefresh");
            const newAccessToken = await refreshAccessToken();

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            logger.error(`[API] Token refresh failed - logging out user`, {
              error: refreshError,
            });
          }

          // If refresh failed or no refresh token, logout user
          logger.error(`[API] Token refresh failed - logging out user`, {
            endpoint: error.config?.url,
            method: error.config?.method,
          });
          useAuthStore.getState().logout();
        }

        return Promise.reject(error);
      }
    );
  }

  protected async request<T>(config: AxiosRequestConfig): Promise<T> {
    const { method = "GET", url = "" } = config;
    const sanitizedData = config.data
      ? sanitizeForLogging(config.data)
      : undefined;
    try {
      const response = await this.api(config);
      return response.data;
    } catch (error) {
      const axiosError = error as {
        response?: { status?: number; data?: unknown };
        message: string;
      };
      logger.error(`[API] ${method.toUpperCase()} ${url} - Failed`, {
        status: axiosError.response?.status,
        error: axiosError.message,
        requestData: sanitizedData,
        responseData: axiosError.response?.data,
      });
      throw error;
    }
  }

  protected async get<T>(url: string): Promise<T> {
    return this.request<T>({ method: "GET", url });
  }

  protected async post<T>(url: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: "POST", url, data });
  }

  protected async put<T>(url: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: "PUT", url, data });
  }

  protected async delete<T>(url: string): Promise<T> {
    return this.request<T>({ method: "DELETE", url });
  }
}
