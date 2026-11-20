import { useEffect, useRef, useCallback } from "react";
import { invoiceApi } from "../api";

export function useDraftAutosave(options: {
  draftId?: string | null;
  isAuthenticated?: boolean;
  data: any;
  isDirty: boolean;
  onSaved?: (savedInvoice?: any) => void;
  onAutoSaved?: () => void;
}) {
  const { draftId, isAuthenticated = true, data, isDirty, onSaved, onAutoSaved } = options;
  const timeoutRef = useRef<any>(null);

  // Sync to sessionStorage
  useEffect(() => {
    if (isDirty) {
      try {
        sessionStorage.setItem("taxgenie_invoice_draft", JSON.stringify(data));
      } catch {
        // Ignore quota errors
      }
    }
  }, [data, isDirty]);

  // Sync to server if authenticated and draftId exists
  useEffect(() => {
    if (!isAuthenticated || !draftId || !isDirty) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await invoiceApi.updateDraft(draftId, data);
        onAutoSaved?.();
      } catch (e) {
        console.warn("Failed to autosave draft to server:", e);
      }
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [draftId, isAuthenticated, isDirty, JSON.stringify(data), onAutoSaved]);

  // Warn before closing tab or navigating if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  const clearLocalDraft = useCallback(() => {
    sessionStorage.removeItem("taxgenie_invoice_draft");
  }, []);

  const getLocalDraft = useCallback(() => {
    try {
      const raw = sessionStorage.getItem("taxgenie_invoice_draft");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  return { clearLocalDraft, getLocalDraft };
}
