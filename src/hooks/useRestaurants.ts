import { useQuery } from "@tanstack/react-query";
import { restaurantApi } from "@/services";
import type { RestaurantFilters } from "@/types";

// Query keys
export const restaurantKeys = {
  all: ["restaurants"] as const,
  lists: () => [...restaurantKeys.all, "list"] as const,
  list: (filters: RestaurantFilters) =>
    [...restaurantKeys.lists(), filters] as const,
  details: () => [...restaurantKeys.all, "detail"] as const,
  detail: (id: string) => [...restaurantKeys.details(), id] as const,
  menus: () => [...restaurantKeys.all, "menu"] as const,
  menu: (id: string, category?: string) =>
    [...restaurantKeys.menus(), id, category] as const,
};

// Hooks
export const useRestaurants = (filters?: RestaurantFilters) => {
  return useQuery({
    queryKey: restaurantKeys.list(filters || {}),
    queryFn: () => restaurantApi.getRestaurants(filters),
    enabled: true,
  });
};

export const useRestaurant = (restaurantId: string) => {
  return useQuery({
    queryKey: restaurantKeys.detail(restaurantId),
    queryFn: () => restaurantApi.getRestaurant(restaurantId),
    enabled: !!restaurantId,
  });
};

export const useRestaurantMenu = (restaurantId: string, category?: string) => {
  return useQuery({
    queryKey: restaurantKeys.menu(restaurantId, category),
    queryFn: () => restaurantApi.getRestaurantMenu(restaurantId, category),
    enabled: !!restaurantId,
  });
};

export const useRestaurantStatus = (restaurantId: string) => {
  return useQuery({
    queryKey: [...restaurantKeys.detail(restaurantId), "status"],
    queryFn: () => restaurantApi.getRestaurant(restaurantId),
    enabled: !!restaurantId,
  });
};
