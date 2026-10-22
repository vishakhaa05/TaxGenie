import { apiClient } from "@/app/api-client";
import { SubscriptionStatusResponse, UpgradePlanInput, SubscriptionData } from "./subscriptionType";

export const subscriptionAPI = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    getSubscriptionStatus: builder.query<SubscriptionStatusResponse, void>({
      query: () => "/subscription/status",
      providesTags: ["subscription", "billingSubscription"],
    }),
    upgradeSubscriptionPlan: builder.mutation<{ success: boolean; message: string; subscription: SubscriptionData }, UpgradePlanInput>({
      query: (body) => ({
        url: "/subscription/upgrade",
        method: "POST",
        body,
      }),
      invalidatesTags: ["subscription", "billingSubscription"],
    }),
  }),
});

export const {
  useGetSubscriptionStatusQuery,
  useUpgradeSubscriptionPlanMutation,
} = subscriptionAPI;
