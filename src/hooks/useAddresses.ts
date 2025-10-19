import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/services";
import { toast } from "react-hot-toast";
import type { AxiosErrorResponse } from "@/types/errors";

export const useAddresses = () => {
  return useQuery({
    queryKey: ["user", "addresses"],
    queryFn: userApi.getAddresses,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAddAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.addAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "addresses"] });
      toast.success("Address added successfully!");
    },
    onError: (error: AxiosErrorResponse) => {
      const errorMessage =
        error?.response?.data?.error || "Failed to add address";
      toast.error(errorMessage);
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      address,
    }: {
      id: string;
      address: Partial<{
        label?: string;
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        isDefault?: boolean;
      }>;
    }) => userApi.updateAddress(id, address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "addresses"] });
      toast.success("Address updated successfully!");
    },
    onError: (error: AxiosErrorResponse) => {
      const errorMessage =
        error?.response?.data?.error || "Failed to update address";
      toast.error(errorMessage);
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "addresses"] });
      toast.success("Address deleted successfully!");
    },
    onError: (error: AxiosErrorResponse) => {
      const errorMessage =
        error?.response?.data?.error || "Failed to delete address";
      toast.error(errorMessage);
    },
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) =>
      userApi.updateAddress(addressId, { isDefault: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "addresses"] });
      toast.success("Default address updated successfully!");
    },
    onError: (error: AxiosErrorResponse) => {
      const errorMessage =
        error?.response?.data?.error || "Failed to set default address";
      toast.error(errorMessage);
    },
  });
};
