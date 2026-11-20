import { useState, useEffect, useRef } from "react";
import { invoiceApi } from "../api";
import { InvoiceEngineResult, InvoiceItem } from "../types";

export function useInvoicePreview(params: {
  items: InvoiceItem[];
  sellerState: string;
  buyerState: string;
  priceIncludesGst: boolean;
  documentType: "tax_invoice" | "bill_of_supply";
}) {
  const [preview, setPreview] = useState<InvoiceEngineResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!params.items || params.items.length === 0) {
      setPreview(null);
      return;
    }

    // Filter valid items that have a description or name and quantity > 0
    const validItems = params.items.filter(
      (it) => (it.description || (it as any).name) && it.quantity > 0
    );

    if (validItems.length === 0) {
      setPreview(null);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const mappedItems = validItems.map((it) => {
          let discountRupees = it.discountValue || 0;
          if (it.discountType === "percent") {
            discountRupees = (it.quantity * it.unitPrice * (it.discountValue || 0)) / 100;
          }

          return {
            name: it.description || "Item",
            hsnOrSac: it.hsnSac || undefined,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            rate: params.documentType === "bill_of_supply" ? 0 : Number(it.gstRate ?? 18),
            discount: discountRupees,
          };
        });

        const res = await invoiceApi.previewInvoice(
          {
            items: mappedItems,
            sellerState: params.sellerState || "27",
            buyerState: params.buyerState || params.sellerState || "27",
            priceIncludesGst: params.priceIncludesGst,
          },
          controller.signal
        );

        setPreview(res);
        setError(null);
      } catch (err: any) {
        if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
          return;
        }
        setError(err.response?.data?.error?.message || err.message || "Failed to calculate preview");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    JSON.stringify(params.items),
    params.sellerState,
    params.buyerState,
    params.priceIncludesGst,
    params.documentType,
  ]);

  return { engineResult: preview, preview, loading, error };
}
