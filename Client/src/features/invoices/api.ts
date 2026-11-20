import { apiClient } from "@/app/api-client";
import {
  BusinessProfile,
  Customer,
  Invoice,
  InvoiceEngineResult,
  InvoiceStatus,
  MonthlySummaryRow,
} from "./types";

const BASE_API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Top-level exported functions for direct imports across components & pages
export async function getBusinessProfile(): Promise<{ success: boolean; data: BusinessProfile | null; error?: string }> {
  try {
    const res = await apiClient.get<{ success: boolean; data: BusinessProfile | null }>("/api/business-profile");
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, data: null, error: err.response?.data?.error?.message || err.message };
  }
}

export async function updateBusinessProfile(profile: Partial<BusinessProfile>): Promise<{ success: boolean; data?: BusinessProfile; error?: string }> {
  try {
    const res = await apiClient.put<{ success: boolean; data: BusinessProfile }>("/api/business-profile", profile);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export async function getCustomers(q?: string): Promise<{ success: boolean; data: Customer[]; error?: string }> {
  try {
    const res = await apiClient.get<{ success: boolean; data: Customer[] }>("/api/customers", { params: { q } });
    return { success: true, data: res.data.data || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.response?.data?.error?.message || err.message };
  }
}

export async function getCustomerById(id: string): Promise<{ success: boolean; data?: Customer; error?: string }> {
  try {
    const res = await apiClient.get<{ success: boolean; data: Customer }>(`/api/customers/${id}`);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export async function createCustomer(customer: Partial<Customer>): Promise<{ success: boolean; data?: Customer; error?: string }> {
  try {
    const res = await apiClient.post<{ success: boolean; data: Customer }>("/api/customers", customer);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<{ success: boolean; data?: Customer; error?: string }> {
  try {
    const res = await apiClient.patch<{ success: boolean; data: Customer }>(`/api/customers/${id}`, updates);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export async function deleteCustomer(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.delete(`/api/customers/${id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export async function getInvoices(params: {
  status?: InvoiceStatus;
  q?: string;
  from?: string;
  to?: string;
  customerId?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<{ success: boolean; data?: { invoices: Invoice[]; total: number; page: number; totalPages: number }; error?: string }> {
  try {
    const res = await apiClient.get<{
      success: boolean;
      data: { invoices: Invoice[]; total: number; page: number; totalPages: number };
    }>("/api/invoices", { params });
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export async function getInvoiceById(id: string): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  try {
    const res = await apiClient.get<{ success: boolean; data: Invoice }>(`/api/invoices/${id}`);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export async function createInvoiceDraft(payload: any): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  try {
    const res = await apiClient.post<{ success: boolean; data: Invoice }>("/api/invoices", payload);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export async function updateInvoiceDraft(id: string, updates: any): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  try {
    const res = await apiClient.patch<{ success: boolean; data: Invoice }>(`/api/invoices/${id}`, updates);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export async function deleteInvoiceDraft(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.delete(`/api/invoices/${id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export async function issueInvoice(id: string): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  try {
    const res = await apiClient.post<{ success: boolean; data: Invoice }>(`/api/invoices/${id}/issue`);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export async function markInvoicePaid(id: string): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  try {
    const res = await apiClient.post<{ success: boolean; data: Invoice }>(`/api/invoices/${id}/mark-paid`);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export async function markInvoiceUnpaid(id: string): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  try {
    const res = await apiClient.post<{ success: boolean; data: Invoice }>(`/api/invoices/${id}/mark-unpaid`);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export async function cancelInvoice(id: string): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  try {
    const res = await apiClient.post<{ success: boolean; data: Invoice }>(`/api/invoices/${id}/cancel`);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export async function duplicateInvoice(id: string): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  try {
    const res = await apiClient.post<{ success: boolean; data: Invoice }>(`/api/invoices/${id}/duplicate`);
    return { success: true, data: res.data.data };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export function getInvoicePdfUrl(id: string): string {
  return `${BASE_API_URL}/invoices/${id}/pdf`;
}

export async function downloadGuestInvoicePdf(payload: any): Promise<void> {
  const token = localStorage.getItem("taxgenie_access_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_API_URL}/invoices/pdf`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error?.message || "Failed to generate guest invoice PDF");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${payload.invoiceNumber || "guest-invoice"}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export async function getInvoiceMonthlySummary(month?: string): Promise<{ success: boolean; data?: MonthlySummaryRow[]; error?: string }> {
  try {
    const res = await apiClient.get<{ success: boolean; data: MonthlySummaryRow[] }>("/api/invoices/summary", {
      params: { month },
    });
    return { success: true, data: res.data.data || [] };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error?.message || err.message };
  }
}

export function getInvoiceCsvExportUrl(status?: InvoiceStatus, from?: string, to?: string): string {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const query = params.toString();
  return `${BASE_API_URL}/invoices/export.csv${query ? `?${query}` : ""}`;
}

export async function previewInvoiceCalculation(
  payload: {
    items: any[];
    sellerState: string;
    buyerState: string;
    priceIncludesGst: boolean;
    taxYear?: string;
  },
  signal?: AbortSignal
): Promise<InvoiceEngineResult> {
  const res = await apiClient.post<{ success: boolean; data: InvoiceEngineResult }>(
    "/api/gst/invoice-preview",
    payload,
    { signal }
  );
  return res.data.data;
}

// Namespace export for legacy / grouped usage
export const invoiceApi = {
  getProfile: getBusinessProfile,
  saveProfile: updateBusinessProfile,
  listCustomers: getCustomers,
  getCustomer: getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  listInvoices: getInvoices,
  getInvoice: getInvoiceById,
  createDraft: createInvoiceDraft,
  updateDraft: updateInvoiceDraft,
  deleteDraft: deleteInvoiceDraft,
  issueInvoice,
  markPaid: markInvoicePaid,
  markUnpaid: markInvoiceUnpaid,
  cancelInvoice,
  duplicateInvoice,
  downloadGuestPdf: downloadGuestInvoicePdf,
  getMonthlySummary: getInvoiceMonthlySummary,
  previewInvoice: previewInvoiceCalculation,
};
export default invoiceApi;
