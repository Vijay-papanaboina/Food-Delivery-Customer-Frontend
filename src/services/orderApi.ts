import { config } from "@/config/env";
import { logger } from "@/lib/logger";
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
  }): Promise<{ message: string; order: Order }> => {
    logger.info(`[OrderAPI] Creating order`, {
      restaurantId: orderData.restaurantId,
      itemCount: orderData.items.length,
      total: orderData.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    });

    const result = await this.post<{ message: string; order: Order }>(
      "/api/orders",
      orderData
    );

    logger.info(`[OrderAPI] Order created successfully`, {
      orderId: result.order.orderId,
      restaurantId: result.order.restaurantId,
      total: result.order.total,
    });

    return result;
  };

  getOrders = async (
    filters?: OrderFilters
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
    const url = queryString ? `/api/orders?${queryString}` : "/api/orders";

    logger.info(`[OrderAPI] Getting orders`, {
      filters: filters || {},
      queryString,
    });

    const result = await this.get<{ message: string; orders: Order[] }>(url);

    logger.info(`[OrderAPI] Orders retrieved successfully`, {
      count: result.orders.length,
    });

    return result;
  };

  getOrder = async (
    orderId: string
  ): Promise<{
    message: string;
    order: Order;
  }> => {
    logger.info(`[OrderAPI] Getting order`, { orderId });

    const result = await this.get<{ message: string; order: Order }>(
      `/api/orders/${orderId}`
    );

    logger.info(`[OrderAPI] Order retrieved successfully`, {
      orderId: result.order.orderId,
      status: result.order.status,
    });

    return result;
  };

  updateOrderStatus = async (
    orderId: string,
    status: string
  ): Promise<{ message: string; order: Order }> => {
    logger.info(`[OrderAPI] Updating order status`, {
      orderId,
      status,
    });

    const result = await this.put<{ message: string; order: Order }>(
      `/api/orders/${orderId}/status`,
      { status }
    );

    logger.info(`[OrderAPI] Order status updated successfully`, {
      orderId: result.order.orderId,
      status: result.order.status,
    });

    return result;
  };

  cancelOrder = async (
    orderId: string
  ): Promise<{ message: string; order: Order }> => {
    logger.info(`[OrderAPI] Cancelling order`, { orderId });

    const result = await this.put<{ message: string; order: Order }>(
      `/api/orders/${orderId}/cancel`
    );

    logger.info(`[OrderAPI] Order cancelled successfully`, {
      orderId: result.order.orderId,
    });

    return result;
  };
}
