import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useCreateOrder } from "@/hooks/useOrders";
import { useProcessPayment } from "@/hooks/usePayments";
import { useAddresses } from "@/hooks/useAddresses";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CreditCard,
  Smartphone,
  DollarSign,
  Loader2,
  MapPin,
  Plus,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import type { PaymentMethod } from "@/types";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, deliveryFee, total, clearCart, restaurantId } =
    useCartStore();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/checkout" } } });
    }
  }, [isAuthenticated, authLoading, navigate]);
  const { data: addressesData } = useAddresses();

  // Check if any items are missing required fields
  const hasInvalidItems = items.some(
    (item) => !item.itemId || !item.restaurantId
  );
  const createOrderMutation = useCreateOrder();
  const processPaymentMutation = useProcessPayment();

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
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("credit_card");
  const [isProcessing, setIsProcessing] = useState(false);

  const addresses = useMemo(
    () => addressesData?.addresses || [],
    [addressesData?.addresses]
  );
  const defaultAddress = useMemo(
    () => addresses.find((addr) => addr.is_default),
    [addresses]
  );

  // Initialize address selection
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId && !useNewAddress) {
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setDeliveryAddress({
          street: defaultAddress.street,
          city: defaultAddress.city,
          state: defaultAddress.state,
          zipCode: defaultAddress.zip_code,
        });
      } else {
        setSelectedAddressId(addresses[0].id);
        setDeliveryAddress({
          street: addresses[0].street,
          city: addresses[0].city,
          state: addresses[0].state,
          zipCode: addresses[0].zip_code,
        });
      }
    }
  }, [addresses, defaultAddress, selectedAddressId, useNewAddress]);

  const paymentMethods = [
    { id: "credit_card", name: "Credit Card", icon: CreditCard },
    { id: "debit_card", name: "Debit Card", icon: CreditCard },
    { id: "paypal", name: "PayPal", icon: Smartphone },
    { id: "cash", name: "Cash on Delivery", icon: DollarSign },
    { id: "crypto", name: "Cryptocurrency", icon: Smartphone },
  ] as const;

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
        zipCode: selectedAddress.zip_code,
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
    logger.info(`[Checkout] Order placement started`, {
      restaurantId,
      itemsCount: items.length,
      totalAmount: total,
      paymentMethod,
    });

    if (!restaurantId) {
      logger.warn(`[Checkout] No restaurant selected`);
      toast.error("No restaurant selected");
      return;
    }

    // Validate address
    const requiredFields = ["street", "city", "state", "zipCode"] as const;
    const missingFields = requiredFields.filter(
      (field) => !deliveryAddress[field]
    );

    if (missingFields.length > 0) {
      logger.warn(`[Checkout] Address validation failed`, {
        missingFields,
      });
      toast.error(`Please fill in: ${missingFields.join(", ")}`);
      return;
    }

    setIsProcessing(true);

    try {
      // Create order
      logger.info(`[Checkout] Creating order`);
      const orderResult = await createOrderMutation.mutateAsync({
        restaurantId,
        items: items.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          price: item.price,
        })),
        deliveryAddress,
      });

      const order = orderResult.order;
      logger.info(`[Checkout] Order created successfully`, {
        orderId: order.orderId,
      });

      // Process payment
      logger.info(`[Checkout] Processing payment`);
      await processPaymentMutation.mutateAsync({
        orderId: order.orderId,
        amount: total,
        method: paymentMethod,
      });

      logger.info(`[Checkout] Order placement completed successfully`, {
        orderId: order.orderId,
        totalAmount: total,
      });

      // Clear cart and redirect
      clearCart();
      toast.success("Order placed successfully!");
      navigate(`/order/${order.orderId}`);
    } catch (error) {
      logger.error(`[Checkout] Order placement failed`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Your Cart is Empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some items to your cart before checking out.
          </p>
          <Button asChild>
            <a href="/">Browse Restaurants</a>
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
              <a href="/">Browse Restaurants</a>
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
          <a href="/cart">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </a>
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
                        <RadioGroupItem value={address.id} id={address.id} />
                        <Label
                          htmlFor={address.id}
                          className="flex-1 cursor-pointer p-3 border rounded-lg hover:bg-accent"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{address.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {address.street}, {address.city},{" "}
                                {address.state} {address.zip_code}
                              </div>
                            </div>
                            {address.is_default && (
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
                            handleAddressSelection(addresses[0].id);
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

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <div
                      key={method.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        paymentMethod === method.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent"
                      }`}
                      onClick={() =>
                        setPaymentMethod(method.id as PaymentMethod)
                      }
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{method.name}</span>
                      {paymentMethod === method.id && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
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
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
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
