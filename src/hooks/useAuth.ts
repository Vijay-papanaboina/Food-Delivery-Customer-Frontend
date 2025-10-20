import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, userApi } from "@/services";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { toast } from "react-hot-toast";
import type { AxiosErrorResponse } from "@/types/errors";
import { logger } from "@/lib/logger";

// Auth mutations
export const useLogin = () => {
  const { login, setLoading, setError, clearError } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onMutate: () => {
      setLoading(true);
      clearError();
    },
    onSuccess: (data) => {
      login(data.user, data.accessToken);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Login successful!");
    },
    onError: (error: AxiosErrorResponse) => {
      const errorMessage = error?.response?.data?.error || "Login failed";
      logger.error(`[useLogin] Login failed`, {
        error: errorMessage,
        status: error.response?.status,
      });
      setError(errorMessage);
      toast.error(errorMessage);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useSignup = () => {
  const { login, setLoading, setError, clearError } = useAuthStore();
  const { mergeLocalStorageToDB } = useCartStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.signup,
    onMutate: () => {
      setLoading(true);
      clearError();
    },
    onSuccess: async (data) => {
      login(data.user, data.accessToken);

      // Merge localStorage cart to DB after successful signup
      await mergeLocalStorageToDB();

      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Account created successfully!");
    },
    onError: (error: AxiosErrorResponse) => {
      const errorMessage = error?.response?.data?.error || "Signup failed";
      logger.error(`[useSignup] Signup failed`, {
        error: errorMessage,
        status: error.response?.status,
      });
      setError(errorMessage);
      toast.error(errorMessage);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useLogout = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // First, call logout API to clear server-side session/cookies
      // This MUST succeed to properly clear the refresh token cookie
      await authApi.logout();

      // Only after successful API call, clear local state
      queryClient.clear();
      logout();
    },
    onSuccess: () => {
      toast.success("Logged out successfully");
    },
    onError: (error: AxiosErrorResponse) => {
      logger.error("Logout failed", { error });
      toast.error("Logout failed - please try again");
      // Don't clear local state if API call failed
    },
  });
};

// User profile queries and mutations
export const useUserProfile = () => {
  const { isAuthenticated, accessToken } = useAuthStore();

  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: userApi.getProfile,
    enabled: isAuthenticated && !!accessToken,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const { updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (data) => {
      updateUser(data.user);
      queryClient.invalidateQueries({ queryKey: ["user", "profile"] });
      toast.success("Profile updated successfully!");
    },
    onError: (error: AxiosErrorResponse) => {
      const errorMessage =
        error?.response?.data?.error || "Failed to update profile";
      toast.error(errorMessage);
    },
  });
};

export const useDeleteProfile = () => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.deleteProfile,
    onSuccess: () => {
      queryClient.clear();
      logout();
      toast.success("Account deleted successfully");
    },
    onError: (error: AxiosErrorResponse) => {
      const errorMessage =
        error?.response?.data?.error || "Failed to delete account";
      toast.error(errorMessage);
    },
  });
};
