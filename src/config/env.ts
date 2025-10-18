export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001",
  paymentApiUrl:
    import.meta.env.VITE_PAYMENT_API_URL || "http://localhost:5002",
  restaurantApiUrl:
    import.meta.env.VITE_RESTAURANT_API_URL || "http://localhost:5006",
  deliveryApiUrl:
    import.meta.env.VITE_DELIVERY_API_URL || "http://localhost:5004",
  userApiUrl: import.meta.env.VITE_USER_API_URL || "http://localhost:5005",
  userId: import.meta.env.VITE_USER_ID || "user-123",
} as const;
