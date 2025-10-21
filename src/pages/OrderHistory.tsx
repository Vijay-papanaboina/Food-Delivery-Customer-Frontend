import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, Eye, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import type { OrderStatus } from "@/types";

export default function OrderHistory() {
  const { isAuthenticated } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const {
    data: ordersData,
    isLoading,
    error,
  } = useOrders({ status: statusFilter });

  const orders = ordersData?.orders || [];

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to view your order history.
          </p>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">
            Error Loading Orders
          </h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Order History</h1>
        <p className="text-muted-foreground">
          Track and manage your past orders
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={statusFilter === undefined ? "default" : "outline"}
          onClick={() => setStatusFilter(undefined)}
        >
          All Orders
        </Button>
        <Button
          variant={statusFilter === "pending_payment" ? "default" : "outline"}
          onClick={() => setStatusFilter("pending_payment")}
        >
          Payment Pending
        </Button>
        <Button
          variant={statusFilter === "confirmed" ? "default" : "outline"}
          onClick={() => setStatusFilter("confirmed")}
        >
          Order Confirmed
        </Button>
        <Button
          variant={statusFilter === "ready" ? "default" : "outline"}
          onClick={() => setStatusFilter("ready")}
        >
          Ready for Pickup
        </Button>
        <Button
          variant={statusFilter === "out_for_delivery" ? "default" : "outline"}
          onClick={() => setStatusFilter("out_for_delivery")}
        >
          Out for Delivery
        </Button>
        <Button
          variant={statusFilter === "delivered" ? "default" : "outline"}
          onClick={() => setStatusFilter("delivered")}
        >
          Delivered
        </Button>
      </div>

      {/* Orders List or Empty State */}
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">
            {statusFilter ? "No Orders Found" : "No Orders Yet"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {statusFilter
              ? "Try selecting a different filter to see your orders."
              : "Start exploring restaurants and place your first order!"}
          </p>
          {!statusFilter && (
            <Button asChild>
              <Link to="/">Browse Restaurants</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

interface OrderCardProps {
  order: {
    orderId: string;
    restaurantId: string;
    items: Array<{
      itemId: string;
      quantity: number;
      price: number;
    }>;
    status: string;
    total: number;
    createdAt: string;
    deliveredAt?: string;
  };
}

function OrderCard({ order }: OrderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "out_for_delivery":
        return "bg-blue-100 text-blue-800";
      case "preparing":
      case "ready":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-purple-100 text-purple-800";
      case "pending_payment":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending_payment":
        return "Pending Payment";
      case "confirmed":
        return "Confirmed";
      case "preparing":
        return "Preparing";
      case "ready":
        return "Ready";
      case "out_for_delivery":
        return "Out for Delivery";
      case "delivered":
        return "Delivered";
      default:
        return status;
    }
  };

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Order #{order.orderId}</h3>
              <Badge className={getStatusColor(order.status)}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>
                  Ordered on {format(new Date(order.createdAt), "PPP p")}
                </span>
              </div>

              {order.deliveredAt && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Delivered on {format(new Date(order.deliveredAt), "PPP p")}
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-4 w-4" />
                <span>
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Items:</h4>
              <div className="space-y-1">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      Item {index + 1} (x{item.quantity})
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="ml-6 flex flex-col space-y-2">
            <Button asChild>
              <Link to={`/orders/${order.orderId}`}>
                <Eye className="h-4 w-4 mr-2" />
                Track Order
              </Link>
            </Button>

            {order.status === "delivered" && (
              <Button variant="outline" size="sm">
                Reorder
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
