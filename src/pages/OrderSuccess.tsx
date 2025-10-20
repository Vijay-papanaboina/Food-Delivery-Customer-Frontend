import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/store/cartStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function OrderSuccess() {
  const navigate = useNavigate();
  const { clearCart, isLoading } = useCartStore();

  useEffect(() => {
    const clearCartAfterLoad = async () => {
      // Wait for cart to finish loading from DB
      if (isLoading) {
        return; // Will re-run when isLoading becomes false
      }

      // Clear cart silently in background
      await clearCart();

      // Redirect after 5 seconds
      const timer = setTimeout(() => {
        navigate("/orders");
      }, 5000);

      // Cleanup timer if unmounted
      return () => clearTimeout(timer);
    };

    clearCartAfterLoad();
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              Payment Successful!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your order has been placed successfully and payment has been
              processed.
            </p>

            <p className="text-sm text-muted-foreground">
              You will be redirected to your orders page in a few seconds...
            </p>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => navigate("/orders")}
                className="flex items-center gap-2"
              >
                View Orders
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
