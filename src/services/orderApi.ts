import { config } from "@/config/env";
import type { Order, OrderFilters, DeliveryAddress } from "@/types";
import { ApiService } from "./baseApi";

// Order API
export class OrderApi extends ApiService {
  constructor() {
    super(config.orderApiUrl);
  }

  createOrder = async (orderData: {
    restaurantId: string;
    items: Array<{ id: string; quantity: number; price: number }>;
    deliveryAddress: DeliveryAddress;
    customerName: string;
    customerPhone: string;
  }): Promise<{ message: string; order: Order }> => {
    const result = await this.post<{ message: string; order: Order }>(
      "/api/order-service/orders",
      orderData,
    );

    return result;
  };

  getOrders = async (
    filters?: OrderFilters,
  ): Promise<{
    message: string;
    orders: Order[];
  }> => {
    const queryParams = new URLSearchParams();

    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.userId) queryParams.append("userId", filters.userId);
    if (filters?.restaurantId)
      queryParams.append("restaurantId", filters.restaurantId);
    if (filters?.limit) queryParams.append("limit", filters.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString
      ? `/api/order-service/orders?${queryString}`
      : "/api/order-service/orders";

    const result = await this.get<{ message: string; orders: Order[] }>(url);

    return result;
  };

  getOrder = async (
    orderId: string,
  ): Promise<{
    message: string;
    order: Order;
  }> => {
    const result = await this.get<{ message: string; order: Order }>(
      `/api/order-service/orders/${orderId}`,
    );

    return result;
  };

  updateOrderStatus = async (
    orderId: string,
    status: string,
  ): Promise<{ message: string; order: Order }> => {
    const result = await this.put<{ message: string; order: Order }>(
      `/api/order-service/orders/${orderId}/status`,
      { status },
    );

    return result;
  };

  cancelOrder = async (
    orderId: string,
  ): Promise<{ message: string; order: Order }> => {
    const result = await this.put<{ message: string; order: Order }>(
      `/api/order-service/orders/${orderId}/cancel`,
    );

    return result;
  };
}
