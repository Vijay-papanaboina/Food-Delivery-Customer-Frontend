import { config } from "@/config/env";
import { logger } from "@/lib/logger";
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
    logger.info(`[PaymentAPI] Creating Stripe Checkout session`, {
      orderId: paymentData.orderId,
    });

    const result = await this.post<{
      message: string;
      sessionId: string;
      url: string;
    }>("/api/payments", paymentData);

    logger.info(`[PaymentAPI] Stripe Checkout session created successfully`, {
      sessionId: result.sessionId,
      orderId: paymentData.orderId,
    });

    return result;
  };

  getPayment = async (
    paymentId: string
  ): Promise<{
    message: string;
    payment: Payment;
  }> => {
    logger.info(`[PaymentAPI] Getting payment`, { paymentId });

    const result = await this.get<{ message: string; payment: Payment }>(
      `/api/payments/${paymentId}`
    );

    logger.info(`[PaymentAPI] Payment retrieved successfully`, {
      paymentId: result.payment.paymentId,
      status: result.payment.status,
    });

    return result;
  };

  getPaymentsByOrder = async (
    orderId: string
  ): Promise<{
    message: string;
    payments: Payment[];
  }> => {
    logger.info(`[PaymentAPI] Getting payments for order`, { orderId });

    const result = await this.get<{ message: string; payments: Payment[] }>(
      `/api/payments/order/${orderId}`
    );

    logger.info(`[PaymentAPI] Payments retrieved successfully`, {
      orderId,
      count: result.payments.length,
    });

    return result;
  };

  refundPayment = async (
    paymentId: string,
    amount?: number
  ): Promise<{ message: string; payment: Payment }> => {
    logger.info(`[PaymentAPI] Refunding payment`, {
      paymentId,
      amount: amount || "full",
    });

    const result = await this.post<{ message: string; payment: Payment }>(
      `/api/payments/${paymentId}/refund`,
      { amount }
    );

    logger.info(`[PaymentAPI] Payment refunded successfully`, {
      paymentId: result.payment.paymentId,
      status: result.payment.status,
    });

    return result;
  };
}
