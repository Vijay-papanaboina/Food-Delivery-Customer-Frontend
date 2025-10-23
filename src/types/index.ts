// Restaurant types
export interface Restaurant {
  restaurantId: string;
  name: string;
  cuisine: string;
  address: string;
  phone: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  isActive: boolean;
  isOpen: boolean;
  imageUrl?: string;
  createdAt: string;
}

// Menu item types
export interface MenuItem {
  itemId: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  preparationTime?: number;
  imageUrl?: string;
  createdAt: string;
}

// Cart types
export interface CartItem {
  itemId: string;
  restaurantId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  isAvailable?: boolean;
}

export interface Cart {
  items: CartItem[];
  restaurantId?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

// Order types
export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "success" | "failed";

export interface OrderItem {
  itemId: string;
  quantity: number;
  price: number;
}

export interface DeliveryAddress {
  id?: string;
  label?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault?: boolean;
}

export interface Order {
  orderId: string;
  restaurantId: string;
  items: OrderItem[];
  userId: string;
  deliveryAddress: DeliveryAddress;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  deliveredAt?: string;
}

// Payment types
export type PaymentMethod =
  | "credit_card"
  | "debit_card"
  | "paypal"
  | "cash"
  | "crypto";

export interface Payment {
  paymentId: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  userId: string;
  status: "pending" | "success" | "failed";
  transactionId?: string;
  createdAt: string;
  processedAt?: string;
}

// Delivery types
export type DeliveryStatus = "assigned" | "picked_up" | "completed";

export interface Driver {
  driverId: string;
  name: string;
  phone: string;
  vehicle: string;
  licensePlate: string;
  isAvailable: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  rating: number;
  totalDeliveries: number;
}

export interface Delivery {
  deliveryId: string;
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicle: string;
  licensePlate: string;
  deliveryAddress: DeliveryAddress;
  status: DeliveryStatus;
  assignedAt?: string;
  pickedUpAt?: string;
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  message: string;
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

// Filter and search types
export interface RestaurantFilters {
  search?: string;
  cuisine?: string;
  minRating?: number;
  maxDeliveryTime?: number;
  sortBy?: "rating" | "deliveryTime" | "deliveryFee";
  sortOrder?: "asc" | "desc";
}

export interface OrderFilters {
  status?: OrderStatus;
  userId?: string;
  restaurantId?: string;
  limit?: number;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  defaultAddress?: DeliveryAddress;
}

// Error types
export interface ApiError {
  error: string;
  details?: string;
  statusCode?: number;
}
