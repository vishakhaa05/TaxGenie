import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FileText,
  Save,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Building2,
  Calendar,
  Sparkles,
  Info,
  Eye,
  Edit3,
  HelpCircle,
  LogIn,
} from "lucide-react";
import PageLayout from "@/components/page-layout";
import { useAuth } from "@/auth/useAuth";
import {
  Invoice,
  InvoiceItem,
  InvoiceSellerSnapshot,
  InvoiceBuyerSnapshot,
  InvoiceDocumentType,
  BusinessProfile,
} from "@/features/invoices/types";
import {
  getBusinessProfile,
  updateBusinessProfile,
  getInvoiceById,
  createInvoiceDraft,
  updateInvoiceDraft,
  issueInvoice,
  getInvoicePdfUrl,
  downloadGuestInvoicePdf,
} from "@/features/invoices/api";
import { useInvoicePreview } from "@/features/invoices/hooks/useInvoicePreview";
import { useDraftAutosave } from "@/features/invoices/hooks/useDraftAutosave";
import { LineItemsTable } from "@/features/invoices/components/LineItemsTable";
import { CustomerSelect } from "@/features/invoices/components/CustomerSelect";
import { TotalsPanel } from "@/features/invoices/components/TotalsPanel";
import { PaperPreview } from "@/features/invoices/components/PaperPreview";
import { IssueDialog } from "@/features/invoices/components/IssueDialog";
import { FALLBACK_GST_STATES, validateGstinOnServer } from "@/features/gst/api";
import { toast } from "sonner";

export const InvoiceBuilderPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: editInvoiceId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const isGuest = !isAuthenticated;

  // Active view tab on mobile
  const [activeTab, setActiveTab] = useState<"details" | "preview">("details");

  // Profile onboarding state for logged-in user without profile
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [showProfileSetupCard, setShowProfileSetupCard] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Form Fields
  const [documentType, setDocumentType] = useState<InvoiceDocumentType>("tax_invoice");
  const [guestInvoiceNumber, setGuestInvoiceNumber] = useState("INV-0001");
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [priceIncludesGst, setPriceIncludesGst] = useState(false);

  // Seller Details
  const [seller, setSeller] = useState<InvoiceSellerSnapshot>({
    legalName: "",
    tradeName: "",
    gstin: "",
    pan: "",
    address: "",
    state: "Maharashtra",
    pincode: "400001",
    phone: "",
    email: "",
    signatureLabel: "Authorised Signatory",
  });

  // Buyer Details
  const [buyer, setBuyer] = useState<InvoiceBuyerSnapshot>({
    name: "",
    gstin: "",
    address: "",
    state: "Maharashtra",
    email: "",
    phone: "",
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [saveCustomerChecked, setSaveCustomerChecked] = useState(false);

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "item-1",
      description: "Professional Services / Advisory",
      hsnSac: "998311",
      quantity: 1,
      unit: "PCS",
      unitPrice: 1000,
      discountType: "percent",
      discountValue: 0,
      gstRate: 18,
    },
  ]);

  // Notes, Terms & Payment Details
  const [notes, setNotes] = useState("Thank you for your business!");
  const [terms, setTerms] = useState("Payment is due within 15 days of invoice date.");
  const [paymentDetailsText, setPaymentDetailsText] = useState("");

  // Modals & Action States
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(editInvoiceId || null);
  const [issuedInvoice, setIssuedInvoice] = useState<Invoice | null>(null);

  // Load Initial Profile and existing draft if editing
  useEffect(() => {
    if (isAuthenticated) {
      loadProfileAndDraft();
    } else {
      // Guest prefill default seller
      setSeller({
        legalName: "My Business Enterprises",
        tradeName: "",
        gstin: "",
        pan: "",
        address: "123 Commercial Plaza, Main Street",
        state: "Maharashtra",
        pincode: "400001",
        phone: "+91 9876543210",
        email: "business@example.com",
        signatureLabel: "Authorised Signatory",
      });
      // If seller has no GSTIN, switch default documentType to bill_of_supply
      setDocumentType("bill_of_supply");
    }

    // Check for GST Calculator prefill handover
    handleGstCalculatorPrefill();
  }, [isAuthenticated, editInvoiceId]);

  const handleGstCalculatorPrefill = () => {
    try {
      const prefillRaw = sessionStorage.getItem("taxgenie_invoice_prefill");
      if (prefillRaw) {
        const data = JSON.parse(prefillRaw);
        if (data && typeof data.amount === "number") {
          setItems([
            {
              id: "item-prefill",
              description: "Services / Goods (From GST Calculator)",
              quantity: 1,
              unit: "PCS",
              unitPrice: data.amount,
              discountType: "percent",
              discountValue: 0,
              gstRate: data.rate || 18,
            },
          ]);
          setPriceIncludesGst(data.mode === "remove");
          if (data.sellerState) {
            setSeller((prev) => ({ ...prev, state: data.sellerState }));
          }
          if (data.buyerState) {
            setBuyer((prev) => ({ ...prev, state: data.buyerState }));
          }
          toast.info(t("invoices.prefilledFromGst", "Prefilled item from GST calculator"));
        }
        sessionStorage.removeItem("taxgenie_invoice_prefill");
      }
    } catch {
      // ignore
    }
  };

  const loadProfileAndDraft = async () => {
    try {
      setProfileLoading(true);
      const profRes = await getBusinessProfile();
      if (profRes.success && profRes.data && profRes.data.legalName) {
        const p = profRes.data;
        setProfile(p);
        setSeller({
          legalName: p.legalName,
          tradeName: p.tradeName,
          gstin: p.gstin || "",
          pan: p.pan || "",
          address: p.address,
          state: p.state,
          pincode: p.pincode,
          phone: p.phone,
          email: p.email,
          signatureLabel: p.signatureLabel || "Authorised Signatory",
        });
        if (p.defaultNotes) setNotes(p.defaultNotes);
        if (p.defaultTerms) setTerms(p.defaultTerms);
        if (p.paymentDetailsText) setPaymentDetailsText(p.paymentDetailsText);

        // If no GSTIN in profile, default to bill_of_supply
        if (!p.gstin) {
          setDocumentType("bill_of_supply");
        }

        // Compute due date from defaultPaymentTermsDays
        if (p.defaultPaymentTermsDays) {
          const due = new Date(Date.now() + p.defaultPaymentTermsDays * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0];
          setDueDate(due);
        }
      } else {
        // No profile found: prompt onboarding card
        setShowProfileSetupCard(true);
      }

      // If editing an existing invoice draft
      if (editInvoiceId) {
        const invRes = await getInvoiceById(editInvoiceId);
        if (invRes.success && invRes.data) {
          const inv = invRes.data;
          if (inv.status !== "draft") {
            toast.warning(t("invoices.cannotEditIssued", "This invoice is already issued and immutable."));
            navigate(`/invoices/${inv._id || inv.id}`);
            return;
          }
          setDraftId(inv._id || inv.id || null);
          setDocumentType(inv.documentType);
          setInvoiceDate(inv.invoiceDate);
          setDueDate(inv.dueDate);
          setSeller(inv.seller);
          setBuyer(inv.buyer);
          setItems(inv.items);
          setPriceIncludesGst(inv.priceIncludesGst);
          if (inv.notes) setNotes(inv.notes);
          if (inv.terms) setTerms(inv.terms);
          if (inv.paymentDetailsText) setPaymentDetailsText(inv.paymentDetailsText);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // Live Engine Calculation Hook
  const { engineResult, loading: calculating, error: calcError } = useInvoicePreview({
    items,
    sellerState: seller.state,
    buyerState: buyer.state,
    priceIncludesGst,
    documentType,
  });

  // Server draft autosave hook for logged-in users
  const isDirty = useMemo(() => {
    return items.length > 0 && buyer.name.trim().length > 0;
  }, [items, buyer]);

  const draftPayload = useMemo(() => {
    return {
      documentType,
      invoiceDate,
      dueDate,
      seller,
      buyer,
      items,
      priceIncludesGst,
      notes,
      terms,
      paymentDetailsText,
    };
  }, [documentType, invoiceDate, dueDate, seller, buyer, items, priceIncludesGst, notes, terms, paymentDetailsText]);

  useDraftAutosave({
    draftId,
    data: draftPayload,
    isDirty: isDirty && !isGuest && !issuedInvoice,
    onSaved: (savedInvoice?: any) => {
      if (savedInvoice && !draftId) {
        setDraftId(savedInvoice._id || savedInvoice.id || null);
      }
    },
  });

  // Handle Quick Onboarding Submit
  const handleProfileOnboardingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller.legalName.trim() || !seller.address.trim() || !seller.state) {
      toast.error(t("invoices.fillRequiredFields", "Please fill required business fields"));
      return;
    }
    try {
      const res = await updateBusinessProfile({
        legalName: seller.legalName,
        tradeName: seller.tradeName,
        gstin: seller.gstin,
        pan: seller.pan,
        address: seller.address,
        state: seller.state,
        pincode: seller.pincode,
        phone: seller.phone,
        email: seller.email,
        invoicePrefix: "INV",
        numberPadding: 4,
        resetEachFinancialYear: true,
        defaultPaymentTermsDays: 15,
        signatureLabel: seller.signatureLabel || "Authorised Signatory",
      });
      if (res.success) {
        toast.success(t("invoices.profileSaved", "Business profile created!"));
        setShowProfileSetupCard(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    }
  };

  // Actions
  const handleSaveDraft = async () => {
    if (isGuest) {
      toast.info(t("invoices.loginToSaveDraft", "Please sign in or register to save drafts and invoices."));
      return;
    }
    if (!seller.legalName.trim()) {
      toast.error(t("invoices.sellerNameRequired", "Seller business name is required"));
      return;
    }

    try {
      setIsDraftSaving(true);
      if (draftId) {
        const res = await updateInvoiceDraft(draftId, draftPayload);
        if (res.success) {
          toast.success(t("invoices.draftUpdated", "Draft saved successfully"));
        } else {
          toast.error(res.error || "Failed to update draft");
        }
      } else {
        const res = await createInvoiceDraft(draftPayload);
        if (res.success && res.data) {
          setDraftId(res.data._id || res.data.id || null);
          toast.success(t("invoices.draftCreated", "Draft created successfully"));
        } else {
          toast.error(res.error || "Failed to save draft");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft");
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handleConfirmIssue = async () => {
    if (isGuest) return;
    if (documentType === "tax_invoice" && !seller.gstin) {
      toast.error(
        t(
          "invoices.sellerGstinRequiredForTaxInvoice",
          "A valid GSTIN is statutory for Tax Invoices. Please select 'Bill of Supply' or add your GSTIN in settings."
        )
      );
      setShowIssueDialog(false);
      return;
    }

    try {
      setIsSubmitting(true);
      let targetId = draftId;

      // If draft not saved to DB yet, save first
      if (!targetId) {
        const draftRes = await createInvoiceDraft(draftPayload);
        if (draftRes.success && draftRes.data) {
          targetId = draftRes.data._id || draftRes.data.id || null;
          setDraftId(targetId);
        } else {
          toast.error(draftRes.error || "Failed to save draft before issuing");
          return;
        }
      }

      if (!targetId) return;

      const issueRes = await issueInvoice(targetId);
      if (issueRes.success && issueRes.data) {
        setIssuedInvoice(issueRes.data);
        setShowIssueDialog(false);
        toast.success(
          t("invoices.issuedSuccess", "Invoice {{number}} issued and finalized!", {
            number: issueRes.data.invoiceNumber,
          })
        );
        navigate(`/invoices/${issueRes.data._id || issueRes.data.id}`);
      } else {
        toast.error(issueRes.error || "Failed to issue invoice");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to issue invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestDownloadPdf = async () => {
    try {
      setIsSubmitting(true);
      await downloadGuestInvoicePdf({
        documentType,
        invoiceNumber: guestInvoiceNumber,
        invoiceDate,
        dueDate,
        seller,
        buyer,
        items,
        priceIncludesGst,
        notes,
        terms,
        paymentDetailsText,
      });
      toast.success(t("invoices.pdfDownloaded", "Invoice PDF downloaded!"));
    } catch (err: any) {
      toast.error(err.message || "Failed to generate guest PDF");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    if (window.confirm(t("invoices.confirmClear", "Reset this invoice form to default?"))) {
      setBuyer({
        name: "",
        gstin: "",
        address: "",
        state: seller.state,
        email: "",
        phone: "",
      });
      setItems([
        {
          id: "item-1",
          description: "Professional Services",
          quantity: 1,
          unit: "PCS",
          unitPrice: 1000,
          discountType: "percent",
          discountValue: 0,
          gstRate: 18,
        },
      ]);
      setDraftId(null);
      toast.info(t("invoices.formReset", "Form reset"));
    }
  };

  return (
    <PageLayout
      title={editInvoiceId ? t("invoices.editDraftTitle", "Edit Draft Invoice") : t("invoices.newInvoiceTitle", "Invoice Generator")}
      subtitle={t(
        "invoices.newInvoiceSubtitle",
        "Create statutory Indian GST tax invoices or bills of supply with live calculations and clean PDF export."
      )}
      addMarginTop
    >
      {/* Statutory e-Invoicing Notice & Disclaimer */}
      <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <p className="leading-relaxed">
            {t(
              "invoices.eInvoicingNotice",
              "TaxGenie helps you prepare invoices. Businesses above the e-invoicing turnover limit must use the government e-invoice system. Please check with a CA."
            )}
          </p>
        </div>
      </div>

      {/* Guest Mode Notice */}
      {isGuest && (
        <div className="mb-6 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-900 dark:text-indigo-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              {t(
                "invoices.guestNotice",
                "You are using TaxGenie in guest mode. You can generate and download print-ready PDFs without logging in. Sign in to save invoices, auto-number, and track payments."
              )}
            </span>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            {t("nav.signIn", "Sign In")}
          </Link>
        </div>
      )}

      {/* Profile Onboarding Card (if logged in without profile) */}
      {showProfileSetupCard && (
        <div className="mb-6 p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-indigo-500/40 shadow-lg space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {t("invoices.setupProfileTitle", "Set Up Your Business Profile")}
              </h3>
              <p className="text-xs text-slate-500">
                {t("invoices.setupProfileSubtitle", "Save your legal business details once to populate all future invoices automatically.")}
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileOnboardingSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-medium mb-1">{t("invoices.legalName", "Legal Business Name")} *</label>
              <input
                type="text"
                required
                value={seller.legalName}
                onChange={(e) => setSeller({ ...seller, legalName: e.target.value })}
                placeholder="e.g. Acme Tech Solutions Pvt Ltd"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">
                {t("invoices.sellerGstin", "GSTIN (Leave blank if unregistered)")}
              </label>
              <input
                type="text"
                maxLength={15}
                value={seller.gstin}
                onChange={(e) => setSeller({ ...seller, gstin: e.target.value.toUpperCase() })}
                placeholder="27AAAAA0000A1Z5"
                className="w-full px-3 py-2 uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium mb-1">{t("invoices.registeredAddress", "Registered Address")} *</label>
              <input
                type="text"
                required
                value={seller.address}
                onChange={(e) => setSeller({ ...seller, address: e.target.value })}
                placeholder="e.g. 101 Corporate Towers, BKC, Mumbai"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">{t("invoices.state", "State")} *</label>
              <select
                value={seller.state}
                onChange={(e) => setSeller({ ...seller, state: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden cursor-pointer"
              >
                {FALLBACK_GST_STATES.map((st) => (
                  <option key={st.code} value={st.name}>
                    {st.code} - {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">{t("invoices.pincode", "Pincode")}</label>
              <input
                type="text"
                maxLength={6}
                value={seller.pincode}
                onChange={(e) => setSeller({ ...seller, pincode: e.target.value })}
                placeholder="400051"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowProfileSetupCard(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                {t("common.skipForNow", "Skip for Now")}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm cursor-pointer"
              >
                {t("common.saveProfile", "Save Business Profile")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Tab Selector */}
      <div className="lg:hidden flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "details"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{t("invoices.tabDetails", "Invoice Form")}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "preview"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t("invoices.tabPreview", "Live Preview")}</span>
        </button>
      </div>

      {/* Two Column Layout on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-20 lg:pb-8">
        {/* Left Column: Form Controls */}
        <div className={`lg:col-span-6 space-y-5 ${activeTab === "preview" ? "hidden lg:block" : "block"}`}>
          {/* Section 1: Document Type & Header Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                  {t("invoices.documentTypeAndDates", "Document Type & Dates")}
                </h3>
              </div>
            </div>

            {/* Document Type Radio Pills */}
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                {t("invoices.selectDocumentType", "Select Document Type")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDocumentType("tax_invoice")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    documentType === "tax_invoice"
                      ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 font-semibold ring-1 ring-indigo-500"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <p className="text-xs font-bold">{t("invoices.taxInvoice", "Tax Invoice")}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t("invoices.taxInvoiceDesc", "GST registered sellers. Includes statutory tax breakdown.")}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDocumentType("bill_of_supply")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    documentType === "bill_of_supply"
                      ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 font-semibold ring-1 ring-indigo-500"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <p className="text-xs font-bold">{t("invoices.billOfSupply", "Bill of Supply")}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t("invoices.billOfSupplyDesc", "Unregistered sellers or composition dealers. No GST charged.")}
                  </p>
                </button>
              </div>
            </div>

            {/* Dates & Numbering */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("invoices.invoiceNumber", "Invoice Number")}
                </label>
                {isGuest ? (
                  <input
                    type="text"
                    maxLength={16}
                    value={guestInvoiceNumber}
                    onChange={(e) => setGuestInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden"
                  />
                ) : (
                  <div className="px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                    {issuedInvoice ? issuedInvoice.invoiceNumber : t("invoices.assignedOnIssue", "Assigned on issue")}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("invoices.invoiceDate", "Invoice Date")}
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("invoices.dueDate", "Due Date")}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden"
                />
              </div>
            </div>

            {/* Place of supply badge */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-400">
              <span>{t("invoices.placeOfSupply", "Place of Supply")}:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {buyer.state} (
                {engineResult?.supplyType === "inter"
                  ? t("invoices.interStateIgst", "Inter-State / IGST")
                  : t("invoices.intraStateCgstSgst", "Intra-State / CGST + SGST")}
                )
              </span>
            </div>
          </div>

          {/* Section 2: Customer / Buyer */}
          <CustomerSelect
            isGuest={isGuest}
            buyer={buyer}
            onChange={setBuyer}
            saveCustomerChecked={saveCustomerChecked}
            onSaveCustomerChange={setSaveCustomerChecked}
            selectedCustomerId={selectedCustomerId}
            onSelectCustomerId={setSelectedCustomerId}
          />

          {/* Section 3: Line Items */}
          <LineItemsTable
            items={items}
            onChange={setItems}
            priceIncludesGst={priceIncludesGst}
            onPriceIncludesGstChange={setPriceIncludesGst}
            documentType={documentType}
          />

          {/* Section 4: Notes, Terms & Bank Details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              {t("invoices.notesAndTerms", "Notes, Terms & Payment Details")}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("invoices.paymentDetailsText", "Bank / UPI Settlement Details")}
                </label>
                <textarea
                  rows={2}
                  maxLength={1000}
                  value={paymentDetailsText}
                  onChange={(e) => setPaymentDetailsText(e.target.value)}
                  placeholder="Bank: HDFC Bank | A/C: 50200012345678 | IFSC: HDFC0000123"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t("invoices.notes", "Customer Notes")}
                  </label>
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Thank you for your business!"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden resize-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t("invoices.terms", "Terms & Conditions")}
                  </label>
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Payment due within 15 days."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar on Desktop */}
          <div className="hidden lg:flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t("common.reset", "Clear")}</span>
            </button>

            <div className="flex items-center gap-2">
              {!isGuest ? (
                <>
                  <button
                    type="button"
                    disabled={isDraftSaving}
                    onClick={handleSaveDraft}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isDraftSaving ? t("common.saving", "Saving...") : t("invoices.saveDraft", "Save Draft")}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setShowIssueDialog(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{t("invoices.issueInvoice", "Issue Invoice")}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleGuestDownloadPdf}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isSubmitting ? t("common.generating", "Generating PDF...") : t("invoices.downloadPdf", "Download PDF")}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Paper Preview & Totals */}
        <div className={`lg:col-span-6 space-y-5 ${activeTab === "details" ? "hidden lg:block" : "block"}`}>
          {/* Totals Panel */}
          <TotalsPanel
            engineResult={engineResult}
            loading={calculating}
            error={calcError}
            documentType={documentType}
          />

          {/* Paper-Style Preview (Always clean white paper look) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t("invoices.liveDocumentPreview", "Live Document Preview (A4 Print-Ready)")}
              </span>
              <span className="text-[11px] text-slate-400">
                {documentType === "tax_invoice" ? "Tax Invoice" : "Bill of Supply"}
              </span>
            </div>

            <PaperPreview
              documentType={documentType}
              invoiceNumber={isGuest ? guestInvoiceNumber : (issuedInvoice?.invoiceNumber || "DRAFT-PREVIEW")}
              invoiceDate={invoiceDate}
              dueDate={dueDate}
              seller={seller}
              buyer={buyer}
              items={items}
              engineResult={engineResult}
              notes={notes}
              terms={terms}
              paymentDetailsText={paymentDetailsText}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Totals & Actions Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 shadow-2xl flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wide block">
            {t("invoices.grandTotal", "Grand Total")}
          </span>
          <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
            ₹{engineResult?.grandTotal?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "0.00"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isGuest ? (
            <>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isDraftSaving}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              >
                {t("invoices.draft", "Draft")}
              </button>
              <button
                type="button"
                onClick={() => setShowIssueDialog(true)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white shadow-sm"
              >
                {t("invoices.issue", "Issue")}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleGuestDownloadPdf}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t("invoices.pdf", "PDF")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Issue Confirmation Dialog */}
      <IssueDialog
        open={showIssueDialog}
        onClose={() => setShowIssueDialog(false)}
        onConfirm={handleConfirmIssue}
        loading={isSubmitting}
        documentType={documentType}
      />
    </PageLayout>
  );
};
export default InvoiceBuilderPage;
