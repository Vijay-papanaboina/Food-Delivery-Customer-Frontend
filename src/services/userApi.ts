import { config } from "@/config/env";
import { logger } from "@/lib/logger";
import type { User, DeliveryAddress } from "@/types";
import type { BackendUser, BackendAddress } from "@/types/api";
import { ApiService } from "./baseApi";

// User API
export class UserApi extends ApiService {
  constructor() {
    super(config.userApiUrl);
  }

  getProfile = async (): Promise<{ message: string; user: User }> => {
    const result = await this.get<{
      message: string;
      user: BackendUser;
    }>("/api/user-service/users/profile");

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

    return {
      message: result.message,
      user,
    };
  };

  updateProfile = async (userData: {
    name?: string;
    phone?: string;
  }): Promise<{ message: string; user: User }> => {
    const result = await this.put<{
      message: string;
      user: BackendUser;
    }>("/api/user-service/users/profile", userData);

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

    return {
      message: result.message,
      user,
    };
  };

  deleteProfile = async (): Promise<{ message: string }> => {
    const result = await this.delete<{ message: string }>(
      "/api/user-service/users/profile"
    );

    return result;
  };

  getAddresses = async (): Promise<{
    message: string;
    addresses: DeliveryAddress[];
  }> => {
    const result = await this.get<{
      message: string;
      addresses: BackendAddress[];
    }>("/api/user-service/users/addresses");

    // Transform BackendAddress to DeliveryAddress
    const addresses: DeliveryAddress[] = result.addresses.map((addr) => ({
      id: addr.id,
      label: addr.label,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      isDefault: addr.isDefault,
    }));

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
    const result = await this.post<{
      message: string;
      address: BackendAddress;
    }>("/api/user-service/users/addresses", {
      label: addressData.label,
      street: addressData.street,
      city: addressData.city,
      state: addressData.state,
      zipCode: addressData.zipCode,
      isDefault: addressData.isDefault || false,
    });

    // Transform BackendAddress to DeliveryAddress
    const address: DeliveryAddress = {
      id: result.address.id,
      label: result.address.label,
      street: result.address.street,
      city: result.address.city,
      state: result.address.state,
      zipCode: result.address.zipCode,
      isDefault: result.address.isDefault,
    };

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
    const result = await this.put<{
      message: string;
      address: BackendAddress;
    }>(`/api/user-service/users/addresses/${addressId}`, {
      label: addressData.label,
      street: addressData.street,
      city: addressData.city,
      state: addressData.state,
      zipCode: addressData.zipCode,
      isDefault: addressData.isDefault,
    });

    // Transform BackendAddress to DeliveryAddress
    const address: DeliveryAddress = {
      id: result.address.id,
      label: result.address.label,
      street: result.address.street,
      city: result.address.city,
      state: result.address.state,
      zipCode: result.address.zipCode,
      isDefault: result.address.isDefault,
    };

    return {
      message: result.message,
      address,
    };
  };

  deleteAddress = async (addressId: string): Promise<{ message: string }> => {
    const result = await this.delete<{ message: string }>(
      `/api/user-service/users/addresses/${addressId}`
    );

    return result;
  };

  getCart = async (): Promise<{
    message: string;
    items: Array<{ itemId: string; quantity: number }>;
  }> => {
    logger.info(`[UserAPI] Getting user cart`);

    const result = await this.get<{
      message: string;
      items: Array<{ itemId: string; quantity: number }>;
    }>("/api/user-service/cart");

    logger.info(`[UserAPI] User cart retrieved successfully`, {
      itemCount: result.items.length,
    });

    return result;
  };

  updateCart = async (
    items: Array<{ itemId: string; quantity: number }>
  ): Promise<{ message: string }> => {
    logger.info(`[UserAPI] Updating user cart`, {
      itemCount: items.length,
    });

    const result = await this.put<{ message: string }>(
      "/api/user-service/cart",
      { items }
    );

    return result;
  };
}
