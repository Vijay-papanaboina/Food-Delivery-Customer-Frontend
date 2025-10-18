import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentApi } from "@/services/api";
import type { PaymentMethod } from "@/types";
import { toast } from "react-hot-toast";

// Query keys
export const paymentKeys = {
  all: ["payments"] as const,
  lists: () => [...paymentKeys.all, "list"] as const,
  list: (filters: { status?: string; method?: string }) =>
    [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, "detail"] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  methods: () => [...paymentKeys.all, "methods"] as const,
  stats: () => [...paymentKeys.all, "stats"] as const,
};

// Hooks
export const usePayments = (filters?: { status?: string; method?: string }) => {
  return useQuery({
    queryKey: paymentKeys.list(filters || {}),
    queryFn: () => paymentApi.getPayments(filters),
    enabled: true,
  });
};

export const usePayment = (orderId: string) => {
  return useQuery({
    queryKey: paymentKeys.detail(orderId),
    queryFn: () => paymentApi.getPayment(orderId),
    enabled: !!orderId,
  });
};

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: paymentKeys.methods(),
    queryFn: () => paymentApi.getPaymentMethods(),
  });
};

export const useProcessPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentData: {
      orderId: string;
      amount: number;
      method: PaymentMethod;
    }) => paymentApi.processPayment(paymentData),
    onSuccess: () => {
      // Invalidate and refetch payments and orders
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      toast.success("Payment processed successfully!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Payment failed");
    },
  });
};
