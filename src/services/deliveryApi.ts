import { config } from "@/config/env";
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
    const result = await this.get<{ message: string; delivery: Delivery }>(
      `/api/deliveries/${deliveryId}`
    );

    return result;
  };

  getDeliveriesByOrder = async (
    orderId: string
  ): Promise<{
    message: string;
    deliveries: Delivery[];
  }> => {
    const result = await this.get<{ message: string; deliveries: Delivery[] }>(
      `/api/deliveries/order/${orderId}`
    );

    return result;
  };

  updateDeliveryStatus = async (
    deliveryId: string,
    status: string
  ): Promise<{ message: string; delivery: Delivery }> => {
    const result = await this.put<{ message: string; delivery: Delivery }>(
      `/api/deliveries/${deliveryId}/status`,
      { status }
    );

    return result;
  };

  assignDriver = async (
    deliveryId: string,
    driverId: string
  ): Promise<{ message: string; delivery: Delivery }> => {
    const result = await this.put<{ message: string; delivery: Delivery }>(
      `/api/deliveries/${deliveryId}/assign`,
      { driverId }
    );

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
    const result = await this.get<{
      message: string;
      location: {
        latitude: number;
        longitude: number;
        lastUpdated: string;
      };
    }>(`/api/deliveries/${deliveryId}/location`);

    return result;
  };
}
