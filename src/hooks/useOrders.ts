import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/services";
import type { OrderFilters, DeliveryAddress } from "@/types";
import { toast } from "react-hot-toast";
import { logger } from "@/lib/logger";

// Query keys
export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  stats: () => [...orderKeys.all, "stats"] as const,
};

// Hooks
export const useOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: orderKeys.list(filters || {}),
    queryFn: () => orderApi.getOrders(filters),
  });
};

export const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => orderApi.getOrder(orderId),
    enabled: !!orderId,
  });
};

export const useOrderStats = () => {
  return useQuery({
    queryKey: orderKeys.stats(),
    queryFn: () => orderApi.getOrders({}),
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: {
      restaurantId: string;
      items: Array<{ id: string; quantity: number; price: number }>;
      deliveryAddress: DeliveryAddress;
      customerName: string;
      customerPhone: string;
    }) => orderApi.createOrder(orderData),
    retry: false, // Prevent auto-retry
    onMutate: () => {},
    onSuccess: () => {
      // Invalidate and refetch orders
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() });

      toast.success("Order created successfully!");
    },
    onError: (error) => {
      logger.error(`[useCreateOrder] Order creation failed`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      toast.error(
        error instanceof Error ? error.message : "Failed to create order"
      );
    },
  });
};
