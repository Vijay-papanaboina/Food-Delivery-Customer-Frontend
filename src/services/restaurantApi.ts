import { config } from "@/config/env";
import { logger } from "@/lib/logger";
import type { Restaurant, MenuItem, RestaurantFilters } from "@/types";
import type { BackendRestaurant, BackendMenuItem } from "@/types/api";
import { ApiService } from "./baseApi";

// Restaurant API
export class RestaurantApi extends ApiService {
  constructor() {
    super(config.restaurantApiUrl);
  }

  getRestaurants = async (
    filters?: RestaurantFilters
  ): Promise<{
    message: string;
    restaurants: Restaurant[];
  }> => {
    const queryParams = new URLSearchParams();

    if (filters?.search) queryParams.append("search", filters.search);
    if (filters?.cuisine) queryParams.append("cuisine", filters.cuisine);
    if (filters?.minRating)
      queryParams.append("minRating", filters.minRating.toString());
    if (filters?.maxDeliveryTime)
      queryParams.append("maxDeliveryTime", filters.maxDeliveryTime.toString());
    if (filters?.sortBy) queryParams.append("sortBy", filters.sortBy);
    if (filters?.sortOrder) queryParams.append("sortOrder", filters.sortOrder);

    const queryString = queryParams.toString();
    const url = queryString
      ? `/api/restaurants?${queryString}`
      : "/api/restaurants";

    logger.info(`[RestaurantAPI] Getting restaurants`, {
      filters: filters || {},
      queryString,
    });

    const result = await this.get<{
      message: string;
      restaurants: BackendRestaurant[];
    }>(url);

    // Transform the API response to match our frontend types
    const restaurants: Restaurant[] = result.restaurants.map(
      (restaurant: BackendRestaurant) => ({
        restaurantId: restaurant.restaurant_id,
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        address: restaurant.address,
        phone: restaurant.phone,
        rating: parseFloat(restaurant.rating),
        deliveryTime: restaurant.delivery_time,
        deliveryFee: parseFloat(restaurant.delivery_fee),
        isActive: restaurant.is_active,
        createdAt: restaurant.created_at,
      })
    );

    logger.info(`[RestaurantAPI] Restaurants retrieved successfully`, {
      count: restaurants.length,
    });

    return {
      message: result.message,
      restaurants,
    };
  };

  getRestaurant = async (
    restaurantId: string
  ): Promise<{
    message: string;
    restaurant: Restaurant;
  }> => {
    logger.info(`[RestaurantAPI] Getting restaurant`, { restaurantId });

    const result = await this.get<{
      message: string;
      restaurant: BackendRestaurant;
    }>(`/api/restaurants/${restaurantId}`);

    // Transform BackendRestaurant to Restaurant
    const restaurant: Restaurant = {
      restaurantId: result.restaurant.restaurant_id,
      name: result.restaurant.name,
      cuisine: result.restaurant.cuisine,
      address: result.restaurant.address,
      phone: result.restaurant.phone,
      rating: parseFloat(result.restaurant.rating),
      deliveryTime: result.restaurant.delivery_time,
      deliveryFee: parseFloat(result.restaurant.delivery_fee),
      isActive: result.restaurant.is_active,
      createdAt: result.restaurant.created_at,
    };

    logger.info(`[RestaurantAPI] Restaurant retrieved successfully`, {
      restaurantId: restaurant.restaurantId,
      name: restaurant.name,
    });

    return {
      message: result.message,
      restaurant,
    };
  };

  getRestaurantMenu = async (
    restaurantId: string,
    category?: string
  ): Promise<MenuItem[]> => {
    const params = category ? `?category=${category}` : "";
    const response = await this.get<{
      message: string;
      menu: BackendMenuItem[];
    }>(`/api/restaurants/${restaurantId}/menu${params}`);

    // Transform BackendMenuItem to MenuItem
    return response.menu.map((item: BackendMenuItem) => ({
      itemId: item.item_id,
      restaurantId: item.restaurant_id,
      name: item.name,
      description: item.description,
      price: parseFloat(item.price),
      category: item.category,
      isAvailable: item.is_available,
      preparationTime: item.preparation_time,
      createdAt: item.created_at,
    }));
  };

  validateMenuItems = async (
    restaurantId: string,
    items: Array<{ id: string; quantity: number }>
  ): Promise<{ valid: boolean; items: MenuItem[]; errors?: string[] }> => {
    return this.post<{ valid: boolean; items: MenuItem[]; errors?: string[] }>(
      `/api/restaurants/${restaurantId}/menu/validate`,
      { items }
    );
  };
}
