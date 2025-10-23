// API Response types for backend data transformation
export interface BackendRestaurant {
  restaurant_id: string;
  name: string;
  cuisine: string;
  address: string;
  phone: string;
  rating: string;
  delivery_time: string;
  delivery_fee: string;
  is_active: boolean;
  is_open: boolean;
  image_url?: string;
  created_at: string;
}

export interface BackendMenuItem {
  item_id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  is_available: boolean;
  preparation_time?: number;
  image_url?: string;
  created_at: string;
}

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackendAddress {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendOrder {
  id: string;
  restaurant_id: string;
  user_id: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
  }>;
  delivery_address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  delivered_at?: string;
}

export interface BackendPayment {
  payment_id: string;
  order_id: string;
  amount: string;
  method: string;
  user_id: string;
  status: string;
  transaction_id?: string;
  failure_reason?: string;
  created_at: string;
  processed_at?: string;
}

export interface BackendDelivery {
  delivery_id: string;
  order_id: string;
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  vehicle: string;
  license_plate: string;
  status: string;
  assigned_at?: string;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  created_at: string;
}
