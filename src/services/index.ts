// Export all API services
export { AuthApi } from "./authApi";
export { UserApi } from "./userApi";
export { RestaurantApi } from "./restaurantApi";
export { OrderApi } from "./orderApi";
export { PaymentApi } from "./paymentApi";
export { DeliveryApi } from "./deliveryApi";

// Create instances for easy importing
import { AuthApi } from "./authApi";
import { UserApi } from "./userApi";
import { RestaurantApi } from "./restaurantApi";
import { OrderApi } from "./orderApi";
import { PaymentApi } from "./paymentApi";
import { DeliveryApi } from "./deliveryApi";

export const authApi = new AuthApi();
export const userApi = new UserApi();
export const restaurantApi = new RestaurantApi();
export const orderApi = new OrderApi();
export const paymentApi = new PaymentApi();
export const deliveryApi = new DeliveryApi();
