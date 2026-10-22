import { apiClient } from "@/app/api-client";
import { AiChatResponse, SavingsAdviceInput, SavingsAdviceResult, SpendingAnomaliesResult } from "./aiAdvisorType";

export const aiAdvisorAPI = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    askAiChat: builder.mutation<AiChatResponse, { question: string }>({
      query: (body) => ({
        url: "/ai-advisor/chat",
        method: "POST",
        body,
      }),
      invalidatesTags: ["aiAdvisor"],
    }),
    getSavingsAdvice: builder.mutation<{ success: boolean; advice: SavingsAdviceResult }, SavingsAdviceInput>({
      query: (body) => ({
        url: "/ai-advisor/savings-advice",
        method: "POST",
        body,
      }),
      invalidatesTags: ["aiAdvisor"],
    }),
    getSpendingAnomalies: builder.query<SpendingAnomaliesResult, void>({
      query: () => "/ai-advisor/anomalies",
      providesTags: ["aiAdvisor"],
    }),
  }),
});

export const {
  useAskAiChatMutation,
  useGetSavingsAdviceMutation,
  useGetSpendingAnomaliesQuery,
} = aiAdvisorAPI;
