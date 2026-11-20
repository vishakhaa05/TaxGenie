import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Save, FileText, CheckCircle2, AlertCircle, RefreshCw, Hash, ShieldCheck, CreditCard } from "lucide-react";
import PageLayout from "@/components/page-layout";
import { getBusinessProfile, updateBusinessProfile } from "@/features/invoices/api";
import { BusinessProfile } from "@/features/invoices/types";
import { FALLBACK_GST_STATES, validateGstinOnServer } from "@/features/gst/api";
import { toast } from "sonner";

export const BusinessProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<BusinessProfile>({
    legalName: "",
    tradeName: "",
    gstin: "",
    pan: "",
    address: "",
    state: "Maharashtra",
    pincode: "",
    phone: "",
    email: "",
    invoicePrefix: "INV",
    numberPadding: 4,
    resetEachFinancialYear: true,
    defaultPaymentTermsDays: 15,
    defaultNotes: "Thank you for your business!",
    defaultTerms: "Payment is due within 15 days of invoice date.",
    paymentDetailsText: "",
    signatureLabel: "Authorised Signatory",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gstinValidating, setGstinValidating] = useState(false);
  const [gstinError, setGstinError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getBusinessProfile();
      if (res.success && res.data) {
        setProfile((prev) => ({
          ...prev,
          ...res.data,
          invoicePrefix: res.data.invoicePrefix || "INV",
          numberPadding: res.data.numberPadding || 4,
          resetEachFinancialYear: res.data.resetEachFinancialYear ?? true,
          defaultPaymentTermsDays: res.data.defaultPaymentTermsDays ?? 15,
        }));
      }
    } catch {
      // offline / not configured yet
    } finally {
      setLoading(false);
    }
  };

  const handleGstinBlur = async (val: string) => {
    const cleaned = val.trim().toUpperCase();
    if (!cleaned) {
      setGstinError(null);
      return;
    }
    setGstinValidating(true);
    try {
      const res = await validateGstinOnServer(cleaned);
      if (!res.valid) {
        setGstinError(res.reason || t("invoices.invalidGstin", "Invalid GSTIN checksum or state code"));
      } else {
        setGstinError(null);
      }
    } catch {
      setGstinError(null);
    } finally {
      setGstinValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.legalName.trim() || !profile.address.trim() || !profile.state) {
      toast.error(t("invoices.fillRequiredFields", "Please complete required business details"));
      return;
    }
    if (gstinError) {
      toast.error(gstinError);
      return;
    }

    try {
      setSaving(true);
      const res = await updateBusinessProfile(profile);
      if (res.success) {
        toast.success(t("invoices.profileSaved", "Business profile & invoice settings saved!"));
      } else {
        toast.error(res.error || t("invoices.failedToSaveProfile", "Failed to save business profile"));
      }
    } catch (err: any) {
      toast.error(err.message || t("invoices.failedToSaveProfile", "Failed to save business profile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout
      title={t("invoices.settingsTitle", "Business Profile & Invoice Settings")}
      subtitle={t(
        "invoices.settingsSubtitle",
        "Configure your legal business identity, sequential numbering rules, and default payment terms."
      )}
      addMarginTop
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Statutory Identity Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Building2 className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {t("invoices.sellerDetails", "Business & Statutory Details")}
                </h3>
                <p className="text-xs text-slate-500">
                  {t("invoices.sellerDetailsDesc", "This information appears in the Seller block of every invoice you issue.")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.legalName", "Legal Business Name")} *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  placeholder="e.g. TaxGenie Advisory Private Limited"
                  value={profile.legalName}
                  onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.tradeName", "Trade / Brand Name (Optional)")}
                </label>
                <input
                  type="text"
                  maxLength={120}
                  placeholder="e.g. TaxGenie"
                  value={profile.tradeName || ""}
                  onChange={(e) => setProfile({ ...profile, tradeName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.sellerGstin", "GSTIN (Mandatory for Tax Invoices)")}
                </label>
                <input
                  type="text"
                  maxLength={15}
                  placeholder="27AAAAA0000A1Z5"
                  value={profile.gstin || ""}
                  onChange={(e) => setProfile({ ...profile, gstin: e.target.value.toUpperCase() })}
                  onBlur={(e) => handleGstinBlur(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
                {gstinValidating && (
                  <p className="text-[11px] text-indigo-500 mt-1">Verifying format & checksum...</p>
                )}
                {gstinError ? (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {gstinError}
                  </p>
                ) : profile.gstin ? (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Valid GSTIN format
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t(
                      "invoices.noGstinNotice",
                      "Without GSTIN, invoices are automatically generated as 'Bill of Supply' without GST tax columns."
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.pan", "PAN Number")}
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="AAAAA0000A"
                  value={profile.pan || ""}
                  onChange={(e) => setProfile({ ...profile, pan: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-sm uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.registeredAddress", "Registered Address")} *
                </label>
                <textarea
                  rows={2}
                  required
                  maxLength={300}
                  placeholder="Shop No. 12, Express Towers, Bandra Kurla Complex, Mumbai"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.state", "State / Union Territory")} *
                </label>
                <select
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer"
                >
                  {FALLBACK_GST_STATES.map((st) => (
                    <option key={st.code} value={st.name}>
                      {st.code} - {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.pincode", "Pincode")}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="400051"
                  value={profile.pincode || ""}
                  onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.phone", "Business Phone")}
                </label>
                <input
                  type="text"
                  maxLength={20}
                  placeholder="+91 9876543210"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.email", "Business Email")}
                </label>
                <input
                  type="email"
                  maxLength={120}
                  placeholder="accounts@taxgenie.in"
                  value={profile.email || ""}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Sequential Numbering Rules Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Hash className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {t("invoices.numberingRules", "Sequential Invoice Numbering")}
                </h3>
                <p className="text-xs text-slate-500">
                  {t("invoices.numberingDesc", "Sequential numbers are assigned automatically when an invoice is issued.")}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.prefix", "Invoice Prefix")}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="INV"
                  value={profile.invoicePrefix}
                  onChange={(e) => setProfile({ ...profile, invoicePrefix: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 text-sm uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.padding", "Number Padding (Digits)")}
                </label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={profile.numberPadding}
                  onChange={(e) => setProfile({ ...profile, numberPadding: parseInt(e.target.value) || 4 })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.defaultPaymentDays", "Default Payment Terms (Days)")}
                </label>
                <input
                  type="number"
                  min={0}
                  max={180}
                  value={profile.defaultPaymentTermsDays}
                  onChange={(e) => setProfile({ ...profile, defaultPaymentTermsDays: parseInt(e.target.value) || 15 })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.resetEachFinancialYear}
                  onChange={(e) => setProfile({ ...profile, resetEachFinancialYear: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <span>{t("invoices.resetFyOption", "Reset sequence to 0001 at the beginning of each Indian Financial Year (April 1st)")}</span>
              </label>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Format Preview: </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {profile.invoicePrefix || "INV"}-
                {profile.resetEachFinancialYear ? "2026-27-" : ""}
                {"1".padStart(profile.numberPadding || 4, "0")}
              </span>
            </div>
          </div>

          {/* Payment Details & Signatory Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  {t("invoices.paymentAndSignatory", "Payment Instructions & Terms")}
                </h3>
                <p className="text-xs text-slate-500">
                  {t("invoices.paymentDesc", "Printed directly on invoices for quick settlement.")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.paymentDetailsText", "Bank / UPI Details (Free text, printed on invoice)")}
                </label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  placeholder={`Bank: HDFC Bank Ltd\nA/C: 50200012345678\nIFSC: HDFC0000123\nUPI ID: taxgenie@hdfcbank`}
                  value={profile.paymentDetailsText || ""}
                  onChange={(e) => setProfile({ ...profile, paymentDetailsText: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("invoices.defaultNotes", "Default Notes")}
                  </label>
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={profile.defaultNotes || ""}
                    onChange={(e) => setProfile({ ...profile, defaultNotes: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("invoices.defaultTerms", "Default Terms & Conditions")}
                  </label>
                  <textarea
                    rows={2}
                    maxLength={1000}
                    value={profile.defaultTerms || ""}
                    onChange={(e) => setProfile({ ...profile, defaultTerms: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.signatoryLabel", "Signature / Designation Label")}
                </label>
                <input
                  type="text"
                  maxLength={120}
                  placeholder="Authorised Signatory / Managing Partner"
                  value={profile.signatureLabel || ""}
                  onChange={(e) => setProfile({ ...profile, signatureLabel: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t("common.saving", "Saving Settings...")}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t("common.save", "Save Profile & Settings")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};
export default BusinessProfilePage;
