import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useRestaurant, useRestaurantMenu } from "@/hooks/useRestaurants";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Star,
  Clock,
  DollarSign,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "react-hot-toast";
import type { MenuItem } from "@/types";

export default function RestaurantMenu() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState(1);

  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant(
    restaurantId!
  );
  const { data: menuItems, isLoading: menuLoading } = useRestaurantMenu(
    restaurantId!,
    selectedCategory
  );

  const { addItem, getItemQuantity, setRestaurant } = useCartStore();

  // Set restaurant in cart when component mounts
  React.useEffect(() => {
    if (restaurant) {
      setRestaurant(restaurant.restaurant.restaurantId);
    }
  }, [restaurant, setRestaurant]);

  const categories = React.useMemo(() => {
    if (!menuItems) return [];
    const uniqueCategories = [
      ...new Set(menuItems.map((item) => item.category)),
    ];
    return uniqueCategories;
  }, [menuItems]);

  const handleAddToCartWithQuantity = async () => {
    if (!selectedItem) return;

    for (let i = 0; i < quantity; i++) {
      await addItem({
        itemId: selectedItem.itemId,
        restaurantId:
          restaurant?.restaurant.restaurantId || selectedItem.restaurantId,
        name: selectedItem.name,
        price: selectedItem.price,
      });
    }

    toast.success(`${quantity}x ${selectedItem.name} added to cart!`);
    setSelectedItem(null);
    setQuantity(1);
  };

  if (restaurantLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">
            Restaurant Not Found
          </h2>
          <p className="text-muted-foreground mb-4">
            The restaurant you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link to="/">Back to Home</Link>
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

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">
                  {restaurant.restaurant.name}
                </h1>
                {!restaurant.restaurant.isOpen && (
                  <Badge variant="destructive">Closed</Badge>
                )}
              </div>
              <Badge variant="secondary" className="mb-4">
                {restaurant.restaurant.cuisine}
              </Badge>
              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span>{restaurant.restaurant.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{restaurant.restaurant.deliveryTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>
                    Delivery: ${restaurant.restaurant.deliveryFee.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-2">Address</p>
              <p className="text-sm">{restaurant.restaurant.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Closed Notice */}
      {!restaurant.restaurant.isOpen && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2 text-destructive">
            <Clock className="h-5 w-5" />
            <div>
              <p className="font-semibold">Restaurant is currently closed</p>
              <p className="text-sm text-destructive/80">
                You can browse the menu, but you won't be able to place orders
                until the restaurant opens.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      {menuLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : menuItems && menuItems.length > 0 ? (
        <Tabs
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="">All</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <MenuItemCard
                  key={item.itemId}
                  item={item}
                  onSelect={setSelectedItem}
                  getQuantity={getItemQuantity}
                  isRestaurantOpen={restaurant.restaurant.isOpen}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No Menu Items Found</h3>
          <p className="text-muted-foreground">
            This restaurant doesn't have any menu items available.
          </p>
        </div>
      )}

      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6">
        <Button size="lg" className="rounded-full shadow-lg" asChild>
          <Link to="/cart">
            <ShoppingCart className="h-5 w-5 mr-2" />
            View Cart
          </Link>
        </Button>
      </div>

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {selectedItem.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  ${selectedItem.price.toFixed(2)}
                </span>
                {selectedItem.preparationTime && (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {selectedItem.preparationTime} min
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleAddToCartWithQuantity}
                  disabled={
                    !selectedItem.isAvailable || !restaurant.restaurant.isOpen
                  }
                >
                  {!restaurant.restaurant.isOpen
                    ? "Restaurant Closed"
                    : !selectedItem.isAvailable
                    ? "Item Unavailable"
                    : `Add to Cart - $${(selectedItem.price * quantity).toFixed(
                        2
                      )}`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MenuItemCardProps {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
  getQuantity: (itemId: string) => number;
  isRestaurantOpen: boolean;
}

function MenuItemCard({
  item,
  onSelect,
  getQuantity,
  isRestaurantOpen,
}: MenuItemCardProps) {
  const quantity = getQuantity(item.itemId);
  const isItemAvailable = item.isAvailable && isRestaurantOpen;
  const isDisabled = !isItemAvailable;

  return (
    <Card
      className={`transition-shadow ${
        isDisabled ? "opacity-60" : "hover:shadow-md"
      }`}
    >
      <CardContent>
        {/* Image */}
        <div className="w-full h-60 bg-muted rounded-md mb-4 flex items-center justify-center overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
          )}
        </div>

        {/* Item Info */}
        <div className="space-y-2">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                {!item.isAvailable && isRestaurantOpen && (
                  <Badge variant="destructive" className="text-xs">
                    Unavailable
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {item.description}
              </p>
            </div>
            <div className="text-right ml-4">
              <span className="text-lg font-bold">
                ${item.price.toFixed(2)}
              </span>
              {item.preparationTime && (
                <div className="text-xs text-muted-foreground mt-1">
                  {item.preparationTime} min
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <Badge variant="outline">{item.category}</Badge>
            <div className="flex items-center space-x-2">
              {quantity > 0 && (
                <Badge variant="secondary">{quantity} in cart</Badge>
              )}
              <Button
                size="sm"
                onClick={() => onSelect(item)}
                disabled={isDisabled}
                variant={isDisabled ? "outline" : "default"}
              >
                <Plus className="h-4 w-4 mr-1" />
                {isDisabled
                  ? !isRestaurantOpen
                    ? "Closed"
                    : "Unavailable"
                  : "Add"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
