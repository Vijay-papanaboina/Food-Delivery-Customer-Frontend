import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { config } from "@/config/env";
import { useAuthStore } from "@/store/authStore";
import { logger, sanitizeForLogging } from "@/lib/logger";
import type {
  Restaurant,
  MenuItem,
  Order,
  Payment,
  Delivery,
  OrderFilters,
  RestaurantFilters,
  DeliveryAddress,
  PaymentMethod,
} from "@/types";
import type {
  BackendRestaurant,
  BackendMenuItem,
  BackendUser,
  BackendAddress,
} from "@/types/api";

// Base API class
class ApiService {
  protected api: AxiosInstance;

  constructor(baseUrl: string) {
    this.api = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include JWT token
    this.api.interceptors.request.use((config) => {
      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        logger.info(
          `[API] JWT token attached to ${config.method?.toUpperCase()} ${
            config.url
          }`
        );
      } else {
        logger.warn(
          `[API] No JWT token available for ${config.method?.toUpperCase()} ${
            config.url
          }`
        );
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logger.error(`[API] 401 Unauthorized - logging out user`, {
            endpoint: error.config?.url,
            method: error.config?.method,
          });
          // Token expired or invalid, logout user
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
      logger.info(`[API] ${method} ${url}`, {
        dataKeys: config.data ? Object.keys(config.data) : undefined,
      });

      const response = await this.api(config);

      logger.info(`[API] ${method} ${url} - Success`, {
        status: response.status,
      });

      return response.data;
    } catch (error: any) {
      logger.error(`[API] ${method} ${url} - Failed`, {
        status: error.response?.status,
        error: error.message,
        requestData: sanitizedData,
        responseData: error.response?.data,
      });
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>({ url: endpoint, method: "GET" });
  }

  // POST request
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>({ url: endpoint, method: "POST", data });
  }

  // PUT request
  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>({ url: endpoint, method: "PUT", data });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>({ url: endpoint, method: "DELETE" });
  }
}

// Restaurant API
class RestaurantApi extends ApiService {
  constructor() {
    super(config.restaurantApiUrl);
  }

  async getRestaurants(filters?: RestaurantFilters): Promise<Restaurant[]> {
    logger.info(`[RestaurantAPI] Getting restaurants`, {
      filters: filters ? Object.keys(filters) : undefined,
    });

    const params = new URLSearchParams();

    if (filters?.search) params.append("search", filters.search);
    if (filters?.cuisine) params.append("cuisine", filters.cuisine);
    if (filters?.minRating)
      params.append("minRating", filters.minRating.toString());
    if (filters?.sortBy) params.append("sortBy", filters.sortBy);
    if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/restaurants?${queryString}`
      : "/api/restaurants";

    const response = await this.get<{
      message: string;
      restaurants: BackendRestaurant[];
      total: number;
    }>(endpoint);

    logger.info(`[RestaurantAPI] Restaurants retrieved successfully`, {
      count: response.restaurants.length,
      total: response.total,
    });

    // Transform the API response to match our frontend types
    return response.restaurants.map((restaurant: BackendRestaurant) => ({
      restaurantId: restaurant.restaurant_id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      address: restaurant.address,
      phone: restaurant.phone,
      rating: parseFloat(restaurant.rating),
      deliveryTime: restaurant.delivery_time,
      deliveryFee: parseFloat(restaurant.delivery_fee),
      isActive: restaurant.is_active,
      createdAt: restaurant.created_at,
    }));
  }

  async getRestaurant(restaurantId: string): Promise<Restaurant> {
    const response = await this.get<{
      message: string;
      restaurant: BackendRestaurant;
    }>(`/api/restaurants/${restaurantId}`);

    // Transform the API response to match our frontend types
    const restaurant = response.restaurant;
    return {
      restaurantId: restaurant.restaurant_id,
      name: restaurant.name,
      cuisine: restaurant.cuisine,
      address: restaurant.address,
      phone: restaurant.phone,
      rating: parseFloat(restaurant.rating),
      deliveryTime: restaurant.delivery_time,
      deliveryFee: parseFloat(restaurant.delivery_fee),
      isActive: restaurant.is_active,
      createdAt: restaurant.created_at,
    };
  }

  async getRestaurantMenu(
    restaurantId: string,
    category?: string
  ): Promise<MenuItem[]> {
    const params = category ? `?category=${category}` : "";
    const response = await this.get<{
      message: string;
      menu: BackendMenuItem[];
    }>(`/api/restaurants/${restaurantId}/menu${params}`);

    // Transform the API response to match our frontend types
    return response.menu.map((item: BackendMenuItem) => ({
      itemId: item.item_id,
      restaurantId: item.restaurant_id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      category: item.category,
      isAvailable: item.is_available,
      preparationTime: item.preparation_time,
      createdAt: item.created_at,
    }));
  }

  async validateMenuItems(
    restaurantId: string,
    items: Array<{ id: string; quantity: number }>
  ): Promise<{ valid: boolean; items: MenuItem[]; errors?: string[] }> {
    return this.post<{ valid: boolean; items: MenuItem[]; errors?: string[] }>(
      `/api/restaurants/${restaurantId}/menu/validate`,
      { items }
    );
  }

  async getRestaurantStatus(
    restaurantId: string
  ): Promise<{ isOpen: boolean; reason?: string }> {
    return this.get<{ isOpen: boolean; reason?: string }>(
      `/api/restaurants/${restaurantId}/status`
    );
  }

  async markOrderReady(
    restaurantId: string,
    orderId: string
  ): Promise<{ message: string; orderId: string; readyAt: string }> {
    return this.post<{ message: string; orderId: string; readyAt: string }>(
      `/api/restaurants/${restaurantId}/orders/${orderId}/ready`,
      {}
    );
  }
}

// Order API
class OrderApi extends ApiService {
  constructor() {
    super(config.apiBaseUrl);
  }

  async createOrder(orderData: {
    restaurantId: string;
    items: Array<{ itemId: string; quantity: number; price: number }>;
    deliveryAddress: DeliveryAddress;
  }): Promise<{ message: string; order: Order }> {
    logger.info(`[OrderAPI] Creating order`, {
      restaurantId: orderData.restaurantId,
      itemsCount: orderData.items.length,
      totalItems: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
    });

    const result = await this.post<{ message: string; order: Order }>(
      "/api/orders",
      orderData
    );

    logger.info(`[OrderAPI] Order created successfully`, {
      orderId: result.order.orderId,
      restaurantId: result.order.restaurantId,
    });

    return result;
  }

  async getOrder(orderId: string): Promise<{ message: string; order: Order }> {
    return this.get<{ message: string; order: Order }>(
      `/api/orders/${orderId}`
    );
  }

  async getOrders(
    filters?: OrderFilters
  ): Promise<{ message: string; orders: Order[]; total: number }> {
    const params = new URLSearchParams();

    if (filters?.status) params.append("status", filters.status);
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.restaurantId)
      params.append("restaurantId", filters.restaurantId);
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/api/orders?${queryString}` : "/api/orders";

    return this.get<{ message: string; orders: Order[]; total: number }>(
      endpoint
    );
  }

  async getOrderStats(): Promise<{
    message: string;
    stats: Record<string, unknown>;
  }> {
    return this.get<{ message: string; stats: Record<string, unknown> }>(
      "/api/orders/stats"
    );
  }
}

// Payment API
class PaymentApi extends ApiService {
  constructor() {
    super(config.paymentApiUrl);
  }

  async processPayment(paymentData: {
    orderId: string;
    amount: number;
    method: PaymentMethod;
  }): Promise<{ message: string; payment: Payment }> {
    logger.info(`[PaymentAPI] Processing payment`, {
      orderId: paymentData.orderId,
      amount: paymentData.amount,
      method: paymentData.method,
    });

    const result = await this.post<{ message: string; payment: Payment }>(
      "/api/payments",
      paymentData
    );

    logger.info(`[PaymentAPI] Payment processed successfully`, {
      paymentId: result.payment.paymentId,
      orderId: result.payment.orderId,
      status: result.payment.status,
    });

    return result;
  }

  async getPayment(
    orderId: string
  ): Promise<{ message: string; payment: Payment }> {
    return this.get<{ message: string; payment: Payment }>(
      `/api/payments/${orderId}`
    );
  }

  async getPayments(filters?: {
    status?: string;
    method?: string;
  }): Promise<{ message: string; payments: Payment[]; total: number }> {
    const params = new URLSearchParams();

    if (filters?.status) params.append("status", filters.status);
    if (filters?.method) params.append("method", filters.method);

    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/payments?${queryString}`
      : "/api/payments";

    return this.get<{ message: string; payments: Payment[]; total: number }>(
      endpoint
    );
  }

  async getPaymentMethods(): Promise<{
    message: string;
    methods: Record<string, { successRate: number; processingDelay: number }>;
  }> {
    return this.get<{
      message: string;
      methods: Record<string, { successRate: number; processingDelay: number }>;
    }>("/api/payments/methods");
  }
}

// Delivery API
class DeliveryApi extends ApiService {
  constructor() {
    super(config.deliveryApiUrl);
  }

  async assignDelivery(assignmentData: {
    orderId: string;
    driverId: string;
    deliveryAddress: DeliveryAddress;
  }): Promise<{
    message: string;
    deliveryId: string;
    orderId: string;
    driverId: string;
    assignedAt: string;
  }> {
    return this.post<{
      message: string;
      deliveryId: string;
      orderId: string;
      driverId: string;
      assignedAt: string;
    }>("/api/delivery/assign", assignmentData);
  }

  async pickupDelivery(pickupData: {
    deliveryId: string;
    orderId: string;
    driverId: string;
  }): Promise<{
    message: string;
    deliveryId: string;
    orderId: string;
    driverId: string;
    pickedUpAt: string;
  }> {
    return this.post<{
      message: string;
      deliveryId: string;
      orderId: string;
      driverId: string;
      pickedUpAt: string;
    }>("/api/delivery/pickup", pickupData);
  }

  async completeDelivery(completionData: {
    deliveryId: string;
    orderId: string;
    driverId: string;
  }): Promise<{
    message: string;
    deliveryId: string;
    orderId: string;
    driverId: string;
    completedAt: string;
  }> {
    return this.post<{
      message: string;
      deliveryId: string;
      orderId: string;
      driverId: string;
      completedAt: string;
    }>("/api/delivery/complete", completionData);
  }

  async getDelivery(
    orderId: string
  ): Promise<{ message: string; delivery: Delivery }> {
    return this.get<{ message: string; delivery: Delivery }>(
      `/api/delivery/${orderId}`
    );
  }

  async getDeliveries(filters?: {
    status?: string;
    driverId?: string;
  }): Promise<{ message: string; deliveries: Delivery[]; total: number }> {
    const params = new URLSearchParams();

    if (filters?.status) params.append("status", filters.status);
    if (filters?.driverId) params.append("driverId", filters.driverId);

    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/delivery?${queryString}`
      : "/api/delivery";

    return this.get<{ message: string; deliveries: Delivery[]; total: number }>(
      endpoint
    );
  }

  async getDrivers(filters?: { available?: boolean }): Promise<{
    message: string;
    drivers: Array<{
      driverId: string;
      name: string;
      phone: string;
      vehicle: string;
      licensePlate: string;
      isAvailable: boolean;
      rating: number;
      totalDeliveries: number;
    }>;
    total: number;
  }> {
    const params = new URLSearchParams();

    if (filters?.available !== undefined)
      params.append("available", filters.available.toString());

    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/drivers?${queryString}`
      : "/api/drivers";

    return this.get<{
      message: string;
      drivers: Array<{
        driverId: string;
        name: string;
        phone: string;
        vehicle: string;
        licensePlate: string;
        isAvailable: boolean;
        rating: number;
        totalDeliveries: number;
      }>;
      total: number;
    }>(endpoint);
  }

  async getDeliveryStats(): Promise<{
    message: string;
    stats: Record<string, unknown>;
  }> {
    return this.get<{ message: string; stats: Record<string, unknown> }>(
      "/api/delivery/stats"
    );
  }
}

// Auth API
class AuthApi extends ApiService {
  constructor() {
    super(config.userApiUrl);
  }

  signup = async (userData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<{
    message: string;
    user: BackendUser;
    accessToken: string;
    refreshToken: string;
  }> => {
    logger.info(`[AuthAPI] User signup attempt`, {
      email: userData.email,
      name: userData.name,
      hasPhone: !!userData.phone,
    });

    const result = await this.post("/api/auth/signup", userData);

    logger.info(`[AuthAPI] User signup successful`, {
      userId: result.user.id,
      email: result.user.email,
    });

    return result;
  };

  login = async (credentials: {
    email: string;
    password: string;
  }): Promise<{
    message: string;
    user: BackendUser;
    accessToken: string;
    refreshToken: string;
  }> => {
    logger.info(`[AuthAPI] User login attempt`, {
      email: credentials.email,
    });

    const result = await this.post("/api/auth/login", credentials);

    logger.info(`[AuthAPI] User login successful`, {
      userId: result.user.id,
      email: result.user.email,
    });

    return result;
  };

  refreshToken = async (
    refreshToken: string
  ): Promise<{
    message: string;
    accessToken: string;
    refreshToken: string;
  }> => {
    return this.post("/api/auth/refresh", { refreshToken });
  };

  validateToken = async (): Promise<{ message: string; user: BackendUser }> => {
    return this.post("/api/auth/validate");
  };
}

// User API
class UserApi extends ApiService {
  constructor() {
    super(config.userApiUrl);
  }

  async getProfile(): Promise<{ message: string; user: BackendUser }> {
    return this.get("/api/users/profile");
  }

  async updateProfile(userData: {
    name?: string;
    phone?: string;
  }): Promise<{ message: string; user: BackendUser }> {
    return this.put("/api/users/profile", userData);
  }

  async deleteProfile(): Promise<{ message: string }> {
    return this.delete("/api/users/profile");
  }

  async getAddresses(): Promise<{
    message: string;
    addresses: BackendAddress[];
  }> {
    return this.get("/api/users/addresses");
  }

  async addAddress(address: {
    label: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault?: boolean;
  }): Promise<{ message: string; address: BackendAddress }> {
    return this.post("/api/users/addresses", address);
  }

  async updateAddress(
    id: string,
    address: {
      label?: string;
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      isDefault?: boolean;
    }
  ): Promise<{ message: string; address: BackendAddress }> {
    return this.put(`/api/users/addresses/${id}`, address);
  }

  async deleteAddress(id: string): Promise<{ message: string }> {
    return this.delete(`/api/users/addresses/${id}`);
  }

  async setDefaultAddress(
    id: string
  ): Promise<{ message: string; address: BackendAddress }> {
    return this.put(`/api/users/addresses/${id}/default`);
  }

  // Cart methods
  async getCart(): Promise<{
    message: string;
    cart: {
      items: Array<{
        itemId: string;
        restaurantId: string;
        name: string;
        price: number;
        quantity: number;
      }>;
      restaurantId?: string;
      subtotal: number;
      deliveryFee: number;
      total: number;
    };
  }> {
    return this.get("/api/cart");
  }

  async updateCart(cartData: {
    restaurantId: string;
    items: Array<{
      itemId: string;
      restaurantId: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    subtotal: number;
    deliveryFee: number;
    total: number;
  }): Promise<{
    message: string;
    cart: {
      items: Array<{
        itemId: string;
        restaurantId: string;
        name: string;
        price: number;
        quantity: number;
      }>;
      restaurantId?: string;
      subtotal: number;
      deliveryFee: number;
      total: number;
    };
  }> {
    return this.put("/api/cart", cartData);
  }

  async clearCart(): Promise<{ message: string }> {
    return this.delete("/api/cart");
  }
}

// Export API instances
export const restaurantApi = new RestaurantApi();
export const orderApi = new OrderApi();
export const paymentApi = new PaymentApi();
export const deliveryApi = new DeliveryApi();
export const authApi = new AuthApi();
export const userApi = new UserApi();

// Export all APIs as a single object for convenience
export const api = {
  restaurant: restaurantApi,
  order: orderApi,
  payment: paymentApi,
  delivery: deliveryApi,
};
