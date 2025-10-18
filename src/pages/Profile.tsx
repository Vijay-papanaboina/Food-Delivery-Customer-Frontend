import React, { useState } from "react";
import {
  useUserProfile,
  useUpdateProfile,
  useDeleteProfile,
} from "@/hooks/useAuth";
import {
  useAddresses,
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/hooks/useAddresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { InlineLoading, PageLoading } from "@/components/ui/loading";
import { Plus, Edit, Trash2, MapPin, User } from "lucide-react";
import type { DeliveryAddress } from "@/types";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(
    null
  );

  const { data: profileData, isLoading: profileLoading } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const deleteProfileMutation = useDeleteProfile();

  const { data: addressesData } = useAddresses();
  const addAddressMutation = useAddAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();
  const setDefaultAddressMutation = useSetDefaultAddress();

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
  });

  const [addressForm, setAddressForm] = useState({
    label: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    isDefault: false,
  });

  // Initialize profile form when data loads
  React.useEffect(() => {
    if (profileData?.user) {
      setProfileForm({
        name: profileData.user.name || "",
        phone: profileData.user.phone || "",
      });
    }
  }, [profileData]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation.mutateAsync(profileForm);
      setIsEditMode(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await updateAddressMutation.mutateAsync({
          id: editingAddress.id!,
          address: addressForm,
        });
      } else {
        await addAddressMutation.mutateAsync(addressForm);
      }
      setIsAddressDialogOpen(false);
      setEditingAddress(null);
      setAddressForm({
        label: "",
        street: "",
        city: "",
        state: "",
        zipCode: "",
        isDefault: false,
      });
    } catch {
      // Error handled by mutation
    }
  };

  const handleEditAddress = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label || "",
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      isDefault: address.isDefault || false,
    });
    setIsAddressDialogOpen(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteAddressMutation.mutateAsync(addressId);
    } catch {
      // Error handled by mutation
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await setDefaultAddressMutation.mutateAsync(addressId);
    } catch {
      // Error handled by mutation
    }
  };

  const handleDeleteProfile = async () => {
    try {
      await deleteProfileMutation.mutateAsync();
    } catch {
      // Error handled by mutation
    }
  };

  if (profileLoading) {
    return (
      <PageLoading
        title="Loading profile..."
        message="Fetching your profile information..."
      />
    );
  }

  const user = profileData?.user;
  const addresses = addressesData?.addresses || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account and addresses
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="profile"
              className="flex items-center space-x-2"
            >
              <User className="h-4 w-4" />
              <span>Profile Info</span>
            </TabsTrigger>
            <TabsTrigger
              value="addresses"
              className="flex items-center space-x-2"
            >
              <MapPin className="h-4 w-4" />
              <span>Saved Addresses</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </div>
                  {!isEditMode && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditMode(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditMode ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={user?.email || ""}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <InlineLoading className="mr-2" />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditMode(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Full Name
                      </Label>
                      <p className="text-lg">{user?.name || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Email Address
                      </Label>
                      <p className="text-lg">{user?.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Phone Number
                      </Label>
                      <p className="text-lg">{user?.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Member Since
                      </Label>
                      <p className="text-lg">
                        {user?.createdAt && user.createdAt !== "Invalid Date"
                          ? new Date(user.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )
                          : "Recently joined"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Permanently delete your account and all associated data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove all your data from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteProfile}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleteProfileMutation.isPending}
                      >
                        {deleteProfileMutation.isPending ? (
                          <>
                            <InlineLoading className="mr-2" />
                            Deleting...
                          </>
                        ) : (
                          "Delete Account"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Saved Addresses</CardTitle>
                    <CardDescription>
                      Manage your delivery addresses
                    </CardDescription>
                  </div>
                  <Dialog
                    open={isAddressDialogOpen}
                    onOpenChange={setIsAddressDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => {
                          setEditingAddress(null);
                          setAddressForm({
                            label: "",
                            street: "",
                            city: "",
                            state: "",
                            zipCode: "",
                            isDefault: false,
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAddress ? "Edit Address" : "Add New Address"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingAddress
                            ? "Update your address information"
                            : "Add a new delivery address to your account"}
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={handleAddressSubmit}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="label">Label</Label>
                          <Input
                            id="label"
                            value={addressForm.label}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                label: e.target.value,
                              }))
                            }
                            placeholder="e.g., Home, Work, Office"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="street">Street Address</Label>
                          <Input
                            id="street"
                            value={addressForm.street}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                street: e.target.value,
                              }))
                            }
                            placeholder="Enter street address"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={addressForm.city}
                              onChange={(e) =>
                                setAddressForm((prev) => ({
                                  ...prev,
                                  city: e.target.value,
                                }))
                              }
                              placeholder="City"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              value={addressForm.state}
                              onChange={(e) =>
                                setAddressForm((prev) => ({
                                  ...prev,
                                  state: e.target.value,
                                }))
                              }
                              placeholder="State"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">ZIP Code</Label>
                          <Input
                            id="zipCode"
                            value={addressForm.zipCode}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                zipCode: e.target.value,
                              }))
                            }
                            placeholder="ZIP code"
                            required
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={addressForm.isDefault}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                isDefault: e.target.checked,
                              }))
                            }
                            className="rounded"
                          />
                          <Label htmlFor="isDefault">
                            Set as default address
                          </Label>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            type="submit"
                            disabled={
                              addAddressMutation.isPending ||
                              updateAddressMutation.isPending
                            }
                            className="flex-1"
                          >
                            {addAddressMutation.isPending ||
                            updateAddressMutation.isPending ? (
                              <>
                                <InlineLoading className="mr-2" />
                                Saving...
                              </>
                            ) : editingAddress ? (
                              "Update Address"
                            ) : (
                              "Add Address"
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddressDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No addresses saved
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first address to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address: DeliveryAddress) => (
                      <div
                        key={address.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{address.label}</h4>
                            {address.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {address.street}, {address.city}, {address.state}{" "}
                            {address.zipCode}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!address.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleSetDefaultAddress(address.id!)
                              }
                              disabled={setDefaultAddressMutation.isPending}
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAddress(address)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id!)}
                            disabled={deleteAddressMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
