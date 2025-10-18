import { config } from "@/config/env";
import { logger } from "@/lib/logger";
import type { Delivery } from "@/types";
import { ApiService } from "./baseApi";

// Delivery API
export class DeliveryApi extends ApiService {
  constructor() {
    super(config.deliveryApiUrl);
  }

  getDelivery = async (
    deliveryId: string
  ): Promise<{
    message: string;
    delivery: Delivery;
  }> => {
    logger.info(`[DeliveryAPI] Getting delivery`, { deliveryId });

    const result = await this.get<{ message: string; delivery: Delivery }>(
      `/api/deliveries/${deliveryId}`
    );

    logger.info(`[DeliveryAPI] Delivery retrieved successfully`, {
      deliveryId: result.delivery.deliveryId,
      status: result.delivery.status,
    });

    return result;
  };

  getDeliveriesByOrder = async (
    orderId: string
  ): Promise<{
    message: string;
    deliveries: Delivery[];
  }> => {
    logger.info(`[DeliveryAPI] Getting deliveries for order`, { orderId });

    const result = await this.get<{ message: string; deliveries: Delivery[] }>(
      `/api/deliveries/order/${orderId}`
    );

    logger.info(`[DeliveryAPI] Deliveries retrieved successfully`, {
      orderId,
      count: result.deliveries.length,
    });

    return result;
  };

  updateDeliveryStatus = async (
    deliveryId: string,
    status: string
  ): Promise<{ message: string; delivery: Delivery }> => {
    logger.info(`[DeliveryAPI] Updating delivery status`, {
      deliveryId,
      status,
    });

    const result = await this.put<{ message: string; delivery: Delivery }>(
      `/api/deliveries/${deliveryId}/status`,
      { status }
    );

    logger.info(`[DeliveryAPI] Delivery status updated successfully`, {
      deliveryId: result.delivery.deliveryId,
      status: result.delivery.status,
    });

    return result;
  };

  assignDriver = async (
    deliveryId: string,
    driverId: string
  ): Promise<{ message: string; delivery: Delivery }> => {
    logger.info(`[DeliveryAPI] Assigning driver to delivery`, {
      deliveryId,
      driverId,
    });

    const result = await this.put<{ message: string; delivery: Delivery }>(
      `/api/deliveries/${deliveryId}/assign`,
      { driverId }
    );

    logger.info(`[DeliveryAPI] Driver assigned successfully`, {
      deliveryId: result.delivery.deliveryId,
      driverId: result.delivery.driverId,
    });

    return result;
  };

  getDriverLocation = async (
    deliveryId: string
  ): Promise<{
    message: string;
    location: {
      latitude: number;
      longitude: number;
      lastUpdated: string;
    };
  }> => {
    logger.info(`[DeliveryAPI] Getting driver location`, { deliveryId });

    const result = await this.get<{
      message: string;
      location: {
        latitude: number;
        longitude: number;
        lastUpdated: string;
      };
    }>(`/api/deliveries/${deliveryId}/location`);

    logger.info(`[DeliveryAPI] Driver location retrieved successfully`, {
      deliveryId,
      latitude: result.location.latitude,
      longitude: result.location.longitude,
    });

    return result;
  };
}
