import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { orderApi, paymentApi } from "@/services";
import { useAddresses } from "@/hooks/useAddresses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, MapPin, Plus } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart, restaurantId } = useCartStore();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/checkout" } } });
    }
  }, [isAuthenticated, authLoading, navigate]);
  const { data: addressesData } = useAddresses();

  // Check if any items are missing required fields
  const hasInvalidItems = items.some(
    (item) => !item.itemId || !item.restaurantId || !item.name || !item.price
  );

  // Prevent concurrent order placement
  const isPlacingOrder = useRef(false);

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [restaurantDeliveryFee, setRestaurantDeliveryFee] = useState(0);

  const addresses = useMemo(() => {
    return addressesData?.addresses || [];
  }, [addressesData?.addresses]);
  const defaultAddress = useMemo(
    () => addresses.find((addr) => addr.isDefault),
    [addresses]
  );

  // Initialize address selection
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId && !useNewAddress) {
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id!);
        setDeliveryAddress({
          street: defaultAddress.street,
          city: defaultAddress.city,
          state: defaultAddress.state,
          zipCode: defaultAddress.zipCode,
        });
      } else {
        setSelectedAddressId(addresses[0].id!);
        setDeliveryAddress({
          street: addresses[0].street,
          city: addresses[0].city,
          state: addresses[0].state,
          zipCode: addresses[0].zipCode,
        });
      }
    }
  }, [addresses, defaultAddress, selectedAddressId, useNewAddress]);

  // Fetch restaurant delivery fee
  useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (restaurantId) {
        try {
          const { restaurantApi } = await import("@/services");
          const restaurant = await restaurantApi.getRestaurant(restaurantId);
          setRestaurantDeliveryFee(restaurant.restaurant.deliveryFee);
        } catch (error) {
          console.error("Failed to fetch restaurant delivery fee:", error);
        }
      }
    };

    fetchDeliveryFee();
  }, [restaurantId]);

  const handleAddressChange = (
    field: keyof typeof deliveryAddress,
    value: string
  ) => {
    setDeliveryAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressSelection = (addressId: string) => {
    setSelectedAddressId(addressId);
    setUseNewAddress(false);
    const selectedAddress = addresses.find((addr) => addr.id === addressId);
    if (selectedAddress) {
      setDeliveryAddress({
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        zipCode: selectedAddress.zipCode,
      });
    }
  };

  const handleUseNewAddress = () => {
    setUseNewAddress(true);
    setSelectedAddressId("");
    setDeliveryAddress({
      street: "",
      city: "",
      state: "",
      zipCode: "",
    });
  };

  const handlePlaceOrder = async () => {
    // Simple guard - if already processing, ignore
    if (isPlacingOrder.current) {
      return;
    }

    if (!user?.phone) {
      toast.error("Please add a phone number to your profile before ordering.");
      navigate("/profile");
      return;
    }

    isPlacingOrder.current = true;
    setIsProcessing(true);

    try {
      // 1. Create order with pending payment status
      const orderResult = await orderApi.createOrder({
        restaurantId: restaurantId!,
        items: items.map((item) => ({
          id: item.itemId,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddress,
        customerName: user.name,
        customerPhone: user.phone,
      });

      const order = orderResult.order;

      // 2. Create Stripe Checkout session
      const sessionResponse = await paymentApi.processPayment({
        orderId: order.orderId,
      });

      // 3. Redirect to Stripe Checkout
      window.location.href = sessionResponse.url;
    } catch (error) {
      console.error("Failed to initialize payment:", error);
      toast.error("Failed to initialize payment. Please try again.");
      isPlacingOrder.current = false;
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some items to your cart before checking out.
          </p>
          <Button asChild>
            <Link to="/">Browse Restaurants</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (hasInvalidItems) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4 text-destructive">
            Invalid Cart Items
          </h2>
          <p className="text-muted-foreground mb-6">
            Some items in your cart are missing required information. Please
            clear your cart and add items again.
          </p>
          <div className="space-x-4">
            <Button onClick={() => clearCart()}>Clear Cart</Button>
            <Button variant="outline" asChild>
              <Link to="/">Browse Restaurants</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/cart">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div className="space-y-6">
          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Saved Addresses */}
              {addresses.length > 0 && !useNewAddress && (
                <div className="space-y-3">
                  <Label>Select a saved address</Label>
                  <RadioGroup
                    value={selectedAddressId}
                    onValueChange={handleAddressSelection}
                  >
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem value={address.id!} id={address.id!} />
                        <Label
                          htmlFor={address.id!}
                          className="flex-1 cursor-pointer p-3 border rounded-lg hover:bg-accent"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{address.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {address.street}, {address.city},{" "}
                                {address.state} {address.zipCode}
                              </div>
                            </div>
                            {address.isDefault && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUseNewAddress}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Use New Address
                    </Button>
                  </div>
                </div>
              )}

              {/* New Address Form */}
              {(useNewAddress || addresses.length === 0) && (
                <div className="space-y-4">
                  {addresses.length > 0 && (
                    <div className="flex items-center justify-between">
                      <Label>Enter new address</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUseNewAddress(false);
                          if (addresses.length > 0) {
                            handleAddressSelection(addresses[0].id!);
                          }
                        }}
                      >
                        Use Saved Address
                      </Button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={deliveryAddress.street}
                        onChange={(e) =>
                          handleAddressChange("street", e.target.value)
                        }
                        placeholder="123 Main Street"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={deliveryAddress.city}
                        onChange={(e) =>
                          handleAddressChange("city", e.target.value)
                        }
                        placeholder="New York"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={deliveryAddress.state}
                        onChange={(e) =>
                          handleAddressChange("state", e.target.value)
                        }
                        placeholder="NY"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={deliveryAddress.zipCode}
                        onChange={(e) =>
                          handleAddressChange("zipCode", e.target.value)
                        }
                        placeholder="10001"
                        required
                      />
                    </div>
                  </div>

                  {/* Save Address Option */}
                  {addresses.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="saveAddress"
                        checked={saveNewAddress}
                        onCheckedChange={(checked) =>
                          setSaveNewAddress(checked as boolean)
                        }
                      />
                      <Label htmlFor="saveAddress" className="text-sm">
                        Save this address for future orders
                      </Label>
                    </div>
                  )}

                  {saveNewAddress && (
                    <div>
                      <Label htmlFor="addressLabel">Address Label</Label>
                      <Input
                        id="addressLabel"
                        value={newAddressLabel}
                        onChange={(e) => setNewAddressLabel(e.target.value)}
                        placeholder="e.g., Home, Work, Office"
                        required
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>${restaurantDeliveryFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${(subtotal + restaurantDeliveryFee).toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  By placing this order, you agree to our terms of service
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
