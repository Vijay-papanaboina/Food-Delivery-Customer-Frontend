import { config } from "@/config/env";
import type { Payment } from "@/types";
import { ApiService } from "./baseApi";

// Payment API
export class PaymentApi extends ApiService {
  constructor() {
    super(config.paymentApiUrl);
  }

  processPayment = async (paymentData: {
    orderId: string;
  }): Promise<{ message: string; sessionId: string; url: string }> => {
    const result = await this.post<{
      message: string;
      sessionId: string;
      url: string;
    }>("/api/payments", paymentData);

    return result;
  };

  getPayment = async (
    paymentId: string
  ): Promise<{
    message: string;
    payment: Payment;
  }> => {
    const result = await this.get<{ message: string; payment: Payment }>(
      `/api/payments/${paymentId}`
    );

    return result;
  };

  getPaymentsByOrder = async (
    orderId: string
  ): Promise<{
    message: string;
    payments: Payment[];
  }> => {
    const result = await this.get<{ message: string; payments: Payment[] }>(
      `/api/payments/order/${orderId}`
    );

    return result;
  };

  refundPayment = async (
    paymentId: string,
    amount?: number
  ): Promise<{ message: string; payment: Payment }> => {
    const result = await this.post<{ message: string; payment: Payment }>(
      `/api/payments/${paymentId}/refund`,
      { amount }
    );

    return result;
  };
}
