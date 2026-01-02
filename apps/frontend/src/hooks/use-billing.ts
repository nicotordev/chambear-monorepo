"use client";

import api from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useBilling() {
  const queryClient = useQueryClient();

  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: () => api.getPlans(),
  });

  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery(
    {
      queryKey: ["billing", "me"],
      queryFn: () => api.getMySubscription(),
    }
  );

  const checkoutMutation = useMutation({
    mutationFn: (tier: string) => api.createCheckout(tier),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Error creating payment session");
    },
  });

  const portalMutation = useMutation({
    mutationFn: () => api.customerPortal(),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Error opening customer portal");
    },
  });

  const topupMutation = useMutation({
    mutationFn: (amount: number) => api.topup(amount),
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        queryClient.invalidateQueries({ queryKey: ["billing", "me"] });
        queryClient.invalidateQueries({ queryKey: ["user", "me"] });
        toast.success("Credits added successfully");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Error starting credit purchase");
    },
  });

  return {
    plans,
    subscription: subscriptionData?.subscription,
    balance: subscriptionData?.balance,
    isLoading: isLoadingPlans || isLoadingSubscription,
    createCheckout: checkoutMutation.mutate,
    isCreatingCheckout: checkoutMutation.isPending,
    openPortal: portalMutation.mutate,
    isOpeningPortal: portalMutation.isPending,
    topup: topupMutation.mutate,
    isToppingUp: topupMutation.isPending,
  };
}
