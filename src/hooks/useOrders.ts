import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderApi } from "@/services/api";
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
    enabled: true,
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
    queryFn: () => orderApi.getOrderStats(),
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: {
      restaurantId: string;
      items: Array<{ itemId: string; quantity: number; price: number }>;
      deliveryAddress: DeliveryAddress;
    }) => orderApi.createOrder(orderData),
    onMutate: (orderData) => {
      logger.info(`[useCreateOrder] Order creation started`, {
        restaurantId: orderData.restaurantId,
        itemsCount: orderData.items.length,
      });
    },
    onSuccess: (data) => {
      logger.info(`[useCreateOrder] Order created successfully`, {
        orderId: data.order.orderId,
        restaurantId: data.order.restaurantId,
      });
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
