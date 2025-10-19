import { Link } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import {
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function Cart() {
  const {
    items,
    total,
    updateQuantity,
    removeItem,
    clearCart,
    isLoading,
    isUpdating,
  } = useCartStore();
  const { isLoading: authLoading } = useAuthStore();

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(itemId);
      toast.success("Item removed from cart");
    } else {
      await updateQuantity(itemId, quantity);
    }
  };

  const handleRemoveItem = async (itemId: string, itemName: string) => {
    await removeItem(itemId);
    toast.success(`${itemName} removed from cart`);
  };

  const handleClearCart = () => {
    clearCart();
    toast.success("Cart cleared");
  };

  // Show loading state while auth is initializing or cart is loading
  if (authLoading || isLoading) {
    return (
      <Loading
        title="Loading your cart..."
        message={authLoading ? "Initializing..." : "Fetching cart items..."}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some delicious items to get started!
          </p>
          <Button asChild>
            <Link to="/">Browse Restaurants</Link>
          </Button>
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
            Back to Restaurants
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Your Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card
              key={item.itemId}
              className={
                item.isAvailable === false ? "opacity-60 border-orange-200" : ""
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      {item.isAvailable === false && (
                        <div className="flex items-center gap-1 text-orange-600 text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Unavailable</span>
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      {item.isAvailable === false
                        ? "Item no longer available"
                        : `$${item.price.toFixed(2)} each`}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Quantity Controls - only show for available items */}
                    {item.isAvailable !== false && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isUpdating}
                          onClick={() =>
                            handleQuantityChange(item.itemId, item.quantity - 1)
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {isUpdating ? "..." : item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isUpdating}
                          onClick={() =>
                            handleQuantityChange(item.itemId, item.quantity + 1)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Quantity Display for unavailable items */}
                    {item.isAvailable === false && (
                      <div className="text-center">
                        <span className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    )}

                    {/* Price */}
                    <div className="text-right">
                      <div className="font-semibold">
                        {item.isAvailable === false
                          ? "N/A"
                          : `$${(item.price * item.quantity).toFixed(2)}`}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => handleRemoveItem(item.itemId, item.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Clear Cart Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              disabled={isUpdating}
              onClick={handleClearCart}
              className="text-destructive hover:text-destructive"
            >
              {isUpdating ? "Updating..." : "Clear Cart"}
            </Button>
          </div>
        </div>

        {/* Checkout Section */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div>
                  <div className="text-2xl font-bold">${total.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">
                    {items.filter((item) => item.isAvailable !== false).length}{" "}
                    items
                  </div>
                </div>

                {items.some((item) => item.isAvailable === false) && (
                  <div className="text-sm text-orange-600 flex items-center justify-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Some items unavailable</span>
                  </div>
                )}

                <Button className="w-full" size="lg" asChild>
                  <Link to="/checkout">Proceed to Checkout</Link>
                </Button>

                <p className="text-xs text-muted-foreground">
                  Review order details at checkout
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
