import { useParams, Link } from "react-router-dom";
import { useOrder } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const ORDER_STATUSES = [
  { key: "confirmed", label: "Order Confirmed", icon: CheckCircle },
  { key: "ready", label: "Ready for Pickup", icon: CheckCircle },
  { key: "out_for_delivery", label: "Out for Delivery", icon: CheckCircle },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
] as const;

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();

  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError,
  } = useOrder(orderId!);

  const order = orderData?.order;

  const getStatusIndex = (status: string) => {
    return ORDER_STATUSES.findIndex((s) => s.key === status);
  };

  if (orderLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">
            Order Not Found
          </h2>
          <p className="text-muted-foreground mb-4">
            The order you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link to="/orders">View All Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Order #{order.orderId}</h1>
            <p className="text-muted-foreground">
              Placed on {format(new Date(order.createdAt), "PPP p")}
            </p>
          </div>
          <Badge
            variant={order.status === "delivered" ? "default" : "secondary"}
            className="text-lg px-4 py-2"
          >
            {ORDER_STATUSES.find((s) => s.key === order.status)?.label ||
              order.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {ORDER_STATUSES.map((status, index) => {
                const Icon = status.icon;
                const isCompleted = index < currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <div key={status.key}>
                    <div className="flex items-center space-x-4">
                      <div
                        className={`flex-shrink-0 ${
                          isCompleted || isCurrent
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-medium ${
                            isCompleted || isCurrent
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {status.label}
                        </p>
                        {isCurrent && (
                          <p className="text-sm text-muted-foreground">
                            {order.status === "ready" &&
                              "Your order is ready for pickup"}
                            {order.status === "out_for_delivery" &&
                              "Your order is on the way"}
                            {order.status === "delivered" &&
                              "Your order has been delivered"}
                          </p>
                        )}
                      </div>
                      {(isCompleted || isCurrent) && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>

                    {/* Vertical dotted line between tasks */}
                    {index < ORDER_STATUSES.length - 1 && (
                      <div className="ml-3 border-l-2 border-dotted border-gray-300 h-6"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <div className="space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">Item {index + 1}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-sm text-muted-foreground">
                    {order.deliveryAddress.street}
                    <br />
                    {order.deliveryAddress.city}, {order.deliveryAddress.state}{" "}
                    {order.deliveryAddress.zipCode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
