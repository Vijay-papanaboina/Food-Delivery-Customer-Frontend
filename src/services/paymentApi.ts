import { config } from "@/config/env";
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
    }>("/api/payment-service/payments", paymentData);

    return result;
  };
}
