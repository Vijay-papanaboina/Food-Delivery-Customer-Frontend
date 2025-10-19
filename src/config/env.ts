export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001",
  orderApiUrl: import.meta.env.VITE_ORDER_API_URL || "http://localhost:5001",
  paymentApiUrl:
    import.meta.env.VITE_PAYMENT_API_URL || "http://localhost:5002",
  notificationApiUrl:
    import.meta.env.VITE_NOTIFICATION_API_URL || "http://localhost:5003",
  deliveryApiUrl:
    import.meta.env.VITE_DELIVERY_API_URL || "http://localhost:5004",
  userApiUrl: import.meta.env.VITE_USER_API_URL || "http://localhost:5005",
  restaurantApiUrl:
    import.meta.env.VITE_RESTAURANT_API_URL || "http://localhost:5006",
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
} as const;
