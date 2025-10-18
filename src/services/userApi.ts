import { config } from "@/config/env";
import { logger } from "@/lib/logger";
import type { User, DeliveryAddress, Cart } from "@/types";
import type { BackendUser, BackendAddress } from "@/types/api";
import { ApiService } from "./baseApi";

// User API
export class UserApi extends ApiService {
  constructor() {
    super(config.userApiUrl);
  }

  getProfile = async (): Promise<{ message: string; user: User }> => {
    logger.info(`[UserAPI] Getting user profile`);

    const result = await this.get<{
      message: string;
      user: BackendUser;
    }>("/api/users/profile");

    // Transform BackendUser to User
    const user: User = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      phone: result.user.phone,
      isActive: result.user.is_active,
      createdAt: result.user.created_at,
      updatedAt: result.user.updated_at,
    };

    logger.info(`[UserAPI] User profile retrieved successfully`, {
      userId: user.id,
      email: user.email,
    });

    return {
      message: result.message,
      user,
    };
  };

  updateProfile = async (userData: {
    name?: string;
    phone?: string;
  }): Promise<{ message: string; user: User }> => {
    logger.info(`[UserAPI] Updating user profile`, {
      hasName: !!userData.name,
      hasPhone: !!userData.phone,
    });

    const result = await this.put<{
      message: string;
      user: BackendUser;
    }>("/api/users/profile", userData);

    // Transform BackendUser to User
    const user: User = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      phone: result.user.phone,
      isActive: result.user.is_active,
      createdAt: result.user.created_at,
      updatedAt: result.user.updated_at,
    };

    logger.info(`[UserAPI] User profile updated successfully`, {
      userId: user.id,
      email: user.email,
    });

    return {
      message: result.message,
      user,
    };
  };

  deleteProfile = async (): Promise<{ message: string }> => {
    logger.info(`[UserAPI] Deleting user profile`);

    const result = await this.delete<{ message: string }>("/api/users/profile");

    logger.info(`[UserAPI] User profile deleted successfully`);

    return result;
  };

  getAddresses = async (): Promise<{
    message: string;
    addresses: DeliveryAddress[];
  }> => {
    logger.info(`[UserAPI] Getting user addresses`);

    const result = await this.get<{
      message: string;
      addresses: BackendAddress[];
    }>("/api/users/addresses");

    // Transform BackendAddress to DeliveryAddress
    const addresses: DeliveryAddress[] = result.addresses.map((addr) => ({
      id: addr.id,
      label: addr.label,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zip_code,
      isDefault: addr.is_default,
    }));

    logger.info(`[UserAPI] User addresses retrieved successfully`, {
      count: addresses.length,
    });

    return {
      message: result.message,
      addresses,
    };
  };

  addAddress = async (addressData: {
    label: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault?: boolean;
  }): Promise<{ message: string; address: DeliveryAddress }> => {
    logger.info(`[UserAPI] Adding new address`, {
      label: addressData.label,
      city: addressData.city,
      state: addressData.state,
    });

    const result = await this.post<{
      message: string;
      address: BackendAddress;
    }>("/api/users/addresses", {
      label: addressData.label,
      street: addressData.street,
      city: addressData.city,
      state: addressData.state,
      zip_code: addressData.zipCode,
      is_default: addressData.isDefault || false,
    });

    // Transform BackendAddress to DeliveryAddress
    const address: DeliveryAddress = {
      id: result.address.id,
      label: result.address.label,
      street: result.address.street,
      city: result.address.city,
      state: result.address.state,
      zipCode: result.address.zip_code,
      isDefault: result.address.is_default,
    };

    logger.info(`[UserAPI] Address added successfully`, {
      addressId: address.id,
      label: address.label,
    });

    return {
      message: result.message,
      address,
    };
  };

  updateAddress = async (
    addressId: string,
    addressData: {
      label?: string;
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      isDefault?: boolean;
    }
  ): Promise<{ message: string; address: DeliveryAddress }> => {
    logger.info(`[UserAPI] Updating address`, {
      addressId,
      hasLabel: !!addressData.label,
      hasStreet: !!addressData.street,
    });

    const result = await this.put<{
      message: string;
      address: BackendAddress;
    }>(`/api/users/addresses/${addressId}`, {
      label: addressData.label,
      street: addressData.street,
      city: addressData.city,
      state: addressData.state,
      zip_code: addressData.zipCode,
      is_default: addressData.isDefault,
    });

    // Transform BackendAddress to DeliveryAddress
    const address: DeliveryAddress = {
      id: result.address.id,
      label: result.address.label,
      street: result.address.street,
      city: result.address.city,
      state: result.address.state,
      zipCode: result.address.zip_code,
      isDefault: result.address.is_default,
    };

    logger.info(`[UserAPI] Address updated successfully`, {
      addressId: address.id,
      label: address.label,
    });

    return {
      message: result.message,
      address,
    };
  };

  deleteAddress = async (addressId: string): Promise<{ message: string }> => {
    logger.info(`[UserAPI] Deleting address`, { addressId });

    const result = await this.delete<{ message: string }>(
      `/api/users/addresses/${addressId}`
    );

    logger.info(`[UserAPI] Address deleted successfully`, { addressId });

    return result;
  };

  getCart = async (): Promise<{ message: string; cart: Cart }> => {
    logger.info(`[UserAPI] Getting user cart`);

    const result = await this.get<{ message: string; cart: Cart }>("/api/cart");

    logger.info(`[UserAPI] User cart retrieved successfully`, {
      itemCount: result.cart.items.length,
      total: result.cart.total,
    });

    return result;
  };

  updateCart = async (cartData: {
    restaurantId: string;
    items: Array<{
      itemId: string;
      quantity: number;
      price: number;
    }>;
    subtotal: number;
    deliveryFee: number;
    total: number;
  }): Promise<{ message: string; cart: Cart }> => {
    logger.info(`[UserAPI] Updating user cart`, {
      restaurantId: cartData.restaurantId,
      itemCount: cartData.items.length,
      total: cartData.total,
    });

    const result = await this.put<{ message: string; cart: Cart }>(
      "/api/cart",
      cartData
    );

    logger.info(`[UserAPI] User cart updated successfully`, {
      itemCount: result.cart.items.length,
      total: result.cart.total,
    });

    return result;
  };
}
