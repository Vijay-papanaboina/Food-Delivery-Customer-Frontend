import { useState } from "react";
import { Link } from "react-router-dom";
import { useRestaurants } from "@/hooks/useRestaurants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Star,
  Clock,
  DollarSign,
  Filter,
  UtensilsCrossed,
} from "lucide-react";
import type { RestaurantFilters } from "@/types";

export default function Home() {
  const [filters, setFilters] = useState<RestaurantFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: restaurantsData, isLoading, error } = useRestaurants(filters);
  const restaurants = restaurantsData?.restaurants || [];

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchQuery || undefined,
    }));
  };

  const handleFilterChange = (
    key: keyof RestaurantFilters,
    value: string | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">
            Error Loading Restaurants
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
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Find Your Perfect Meal</h1>
        <p className="text-xl text-muted-foreground">
          Discover amazing restaurants and order your favorite food
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-card border rounded-lg p-4 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Cuisine
                </label>
                <select
                  value={filters.cuisine || ""}
                  onChange={(e) =>
                    handleFilterChange("cuisine", e.target.value || undefined)
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Cuisines</option>
                  <option value="Italian">Italian</option>
                  <option value="American">American</option>
                  <option value="Thai">Thai</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Indian">Indian</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Sort By
                </label>
                <select
                  value={filters.sortBy || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "sortBy",
                      (e.target.value as
                        | "rating"
                        | "deliveryTime"
                        | "deliveryFee"
                        | undefined) || undefined
                    )
                  }
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Default</option>
                  <option value="rating">Rating</option>
                  <option value="deliveryTime">Delivery Time</option>
                  <option value="deliveryFee">Delivery Fee</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Restaurants Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-48 w-full rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : restaurants && restaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <RestaurantCard
              key={restaurant.restaurantId}
              restaurant={restaurant}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No Restaurants Found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filters
          </p>
          <Button onClick={clearFilters}>Clear Filters</Button>
        </div>
      )}
    </div>
  );
}

interface RestaurantCardProps {
  restaurant: {
    restaurantId: string;
    name: string;
    cuisine: string;
    rating: number;
    deliveryTime: string;
    deliveryFee: number;
    isActive: boolean;
    isOpen: boolean;
    imageUrl?: string;
  };
}

function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const isDisabled = !restaurant.isOpen;

  const cardContent = (
    <>
      <div
        className={`h-64 bg-muted rounded-t-lg flex items-center justify-center overflow-hidden relative ${
          isDisabled ? "opacity-60" : ""
        }`}
      >
        {restaurant.imageUrl ? (
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
        )}
        {isDisabled && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive">Closed</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-5">
        <div className="space-y-3">
          <div>
            <h3
              className={`font-semibold text-lg transition-colors ${
                isDisabled
                  ? "text-muted-foreground"
                  : "group-hover:text-primary"
              }`}
            >
              {restaurant.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{restaurant.cuisine}</Badge>
              {restaurant.isOpen && (
                <Badge variant="default" className="text-xs">
                  Open
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span>{restaurant.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{restaurant.deliveryTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Delivery: ${restaurant.deliveryFee.toFixed(2)}</span>
            </div>
          </div>

          <Button
            className="w-full mt-4"
            disabled={isDisabled}
            variant={isDisabled ? "outline" : "default"}
          >
            {isDisabled ? "Currently Closed" : "View Menu"}
          </Button>
        </div>
      </CardContent>
    </>
  );

  return (
    <Card
      className={`transition-shadow py-0 ${
        isDisabled ? "opacity-75" : "hover:shadow-lg cursor-pointer group"
      }`}
    >
      {isDisabled ? (
        <div className="block">{cardContent}</div>
      ) : (
        <Link to={`/restaurant/${restaurant.restaurantId}`} className="block">
          {cardContent}
        </Link>
      )}
    </Card>
  );
}
