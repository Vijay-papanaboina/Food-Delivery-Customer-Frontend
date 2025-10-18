import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deliveryApi } from "@/services/api";
import type { DeliveryAddress } from "@/types";
import { toast } from "react-hot-toast";

// Query keys
export const deliveryKeys = {
  all: ["deliveries"] as const,
  lists: () => [...deliveryKeys.all, "list"] as const,
  list: (filters: { status?: string; driverId?: string }) =>
    [...deliveryKeys.lists(), filters] as const,
  details: () => [...deliveryKeys.all, "detail"] as const,
  detail: (id: string) => [...deliveryKeys.details(), id] as const,
  drivers: () => [...deliveryKeys.all, "drivers"] as const,
  driverList: (filters: { available?: boolean }) =>
    [...deliveryKeys.drivers(), filters] as const,
  stats: () => [...deliveryKeys.all, "stats"] as const,
};

// Hooks
export const useDeliveries = (filters?: {
  status?: string;
  driverId?: string;
}) => {
  return useQuery({
    queryKey: deliveryKeys.list(filters || {}),
    queryFn: () => deliveryApi.getDeliveries(filters),
    enabled: true,
  });
};

export const useDelivery = (orderId: string) => {
  return useQuery({
    queryKey: deliveryKeys.detail(orderId),
    queryFn: () => deliveryApi.getDelivery(orderId),
    enabled: !!orderId,
  });
};

export const useDrivers = (filters?: { available?: boolean }) => {
  return useQuery({
    queryKey: deliveryKeys.driverList(filters || {}),
    queryFn: () => deliveryApi.getDrivers(filters),
    enabled: true,
  });
};

export const useDeliveryStats = () => {
  return useQuery({
    queryKey: deliveryKeys.stats(),
    queryFn: () => deliveryApi.getDeliveryStats(),
  });
};

export const useAssignDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentData: {
      orderId: string;
      driverId: string;
      deliveryAddress: DeliveryAddress;
    }) => deliveryApi.assignDelivery(assignmentData),
    onSuccess: () => {
      // Invalidate and refetch deliveries
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.drivers() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.stats() });

      toast.success("Delivery assigned successfully!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign delivery"
      );
    },
  });
};

export const usePickupDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pickupData: {
      deliveryId: string;
      orderId: string;
      driverId: string;
    }) => deliveryApi.pickupDelivery(pickupData),
    onSuccess: () => {
      // Invalidate and refetch deliveries
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.drivers() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.stats() });

      toast.success("Delivery picked up successfully!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to pick up delivery"
      );
    },
  });
};

export const useCompleteDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (completionData: {
      deliveryId: string;
      orderId: string;
      driverId: string;
    }) => deliveryApi.completeDelivery(completionData),
    onSuccess: () => {
      // Invalidate and refetch deliveries
      queryClient.invalidateQueries({ queryKey: deliveryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.drivers() });
      queryClient.invalidateQueries({ queryKey: deliveryKeys.stats() });

      toast.success("Delivery completed successfully!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to complete delivery"
      );
    },
  });
};
