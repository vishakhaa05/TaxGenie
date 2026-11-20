import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User, Plus, Search, Check, Building2, MapPin, Mail, Phone, Sparkles } from "lucide-react";
import { Customer, InvoiceBuyerSnapshot } from "../types";
import { getCustomers, createCustomer } from "../api";
import { FALLBACK_GST_STATES } from "@/features/gst/api";
import { validateGstinOnServer } from "@/features/gst/api";
import { toast } from "sonner";

interface CustomerSelectProps {
  isGuest: boolean;
  buyer: InvoiceBuyerSnapshot;
  onChange: (buyer: InvoiceBuyerSnapshot) => void;
  saveCustomerChecked?: boolean;
  onSaveCustomerChange?: (checked: boolean) => void;
  selectedCustomerId?: string | null;
  onSelectCustomerId?: (id: string | null) => void;
}

export const CustomerSelect: React.FC<CustomerSelectProps> = ({
  isGuest,
  buyer,
  onChange,
  saveCustomerChecked = false,
  onSaveCustomerChange,
  selectedCustomerId = null,
  onSelectCustomerId,
}) => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New customer form state
  const [newCust, setNewCust] = useState({
    name: "",
    gstin: "",
    address: "",
    state: buyer.state || "Maharashtra",
    email: "",
    phone: "",
  });
  const [creating, setCreating] = useState(false);
  const [gstinValidating, setGstinValidating] = useState(false);
  const [gstinError, setGstinError] = useState<string | null>(null);

  useEffect(() => {
    if (!isGuest) {
      loadCustomers();
    }
  }, [isGuest]);

  const loadCustomers = async (q?: string) => {
    try {
      setLoading(true);
      const res = await getCustomers(q);
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch {
      // offline or error handled gracefully
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    loadCustomers(val);
  };

  const handleSelectCustomer = (c: Customer) => {
    onSelectCustomerId?.(c._id || c.id || null);
    onChange({
      name: c.name,
      gstin: c.gstin || "",
      address: c.address,
      state: c.state,
      email: c.email || "",
      phone: c.phone || "",
    });
    setDropdownOpen(false);
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
        setGstinError(res.reason || t("invoices.invalidGstin", "Invalid GSTIN format"));
      } else {
        setGstinError(null);
      }
    } catch {
      setGstinError(null);
    } finally {
      setGstinValidating(false);
    }
  };

  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name.trim() || !newCust.address.trim() || !newCust.state) {
      toast.error(t("invoices.fillRequiredFields", "Please fill required customer fields"));
      return;
    }
    if (gstinError) {
      toast.error(gstinError);
      return;
    }

    try {
      setCreating(true);
      const res = await createCustomer(newCust);
      if (res.success && res.data) {
        toast.success(t("invoices.customerCreated", "Customer added successfully"));
        setCustomers((prev) => [res.data, ...prev]);
        handleSelectCustomer(res.data);
        setShowAddModal(false);
        setNewCust({
          name: "",
          gstin: "",
          address: "",
          state: "Maharashtra",
          email: "",
          phone: "",
        });
      } else {
        toast.error(res.error || t("invoices.failedToCreateCustomer", "Failed to add customer"));
      }
    } catch (err: any) {
      toast.error(err.message || t("invoices.failedToCreateCustomer", "Failed to add customer"));
    } finally {
      setCreating(false);
    }
  };

  // If GUEST: simple manual form
  if (isGuest) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <User className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
            {t("invoices.buyerDetails", "Customer / Buyer Details")}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("invoices.customerName", "Customer / Business Name")} *
            </label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Acme Innovations Pvt Ltd"
              value={buyer.name}
              onChange={(e) => onChange({ ...buyer, name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("invoices.buyerGstin", "Customer GSTIN (Optional)")}
            </label>
            <input
              type="text"
              maxLength={15}
              placeholder="e.g. 27AAAAA0000A1Z5"
              value={buyer.gstin || ""}
              onChange={(e) => onChange({ ...buyer, gstin: e.target.value.toUpperCase() })}
              onBlur={(e) => handleGstinBlur(e.target.value)}
              className="w-full px-3 py-2 text-sm uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
            {gstinError && <p className="text-[11px] text-rose-500 mt-1">{gstinError}</p>}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("invoices.billingAddress", "Billing Address")} *
            </label>
            <input
              type="text"
              required
              maxLength={300}
              placeholder="e.g. 402 Business Park, Andheri East"
              value={buyer.address}
              onChange={(e) => onChange({ ...buyer, address: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("invoices.placeOfSupply", "Place of Supply / State")} *
            </label>
            <select
              value={buyer.state}
              onChange={(e) => onChange({ ...buyer, state: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer"
            >
              {FALLBACK_GST_STATES.map((st) => (
                <option key={st.code} value={st.name}>
                  {st.code} - {st.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              {t("invoices.clientEmail", "Email (Optional)")}
            </label>
            <input
              type="email"
              maxLength={120}
              placeholder="billing@client.com"
              value={buyer.email || ""}
              onChange={(e) => onChange({ ...buyer, email: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>
        </div>
      </div>
    );
  }

  // Logged-in Customer Select with Searchable Dropdown & Add Customer Dialog
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 relative">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
            {t("invoices.customer", "Customer / Buyer")}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("invoices.addNewCustomer", "Add New")}
        </button>
      </div>

      {/* Customer search select or manual fill */}
      <div className="relative">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          {t("invoices.chooseSavedCustomer", "Choose saved customer or enter details")}
        </label>
        <div
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 flex items-center justify-between cursor-pointer hover:border-indigo-400"
        >
          <span className={buyer.name ? "font-medium" : "text-slate-400"}>
            {buyer.name || t("invoices.selectCustomerPlaceholder", "Select customer...")}
          </span>
          <Search className="w-4 h-4 text-slate-400" />
        </div>

        {dropdownOpen && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 space-y-2 max-h-60 overflow-y-auto">
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder={t("invoices.searchCustomers", "Search customer by name...")}
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                <div className="p-3 text-xs text-center text-slate-400">Loading...</div>
              ) : customers.length === 0 ? (
                <div className="p-3 text-xs text-center text-slate-400">
                  {t("invoices.noCustomersFound", "No saved customers found")}
                </div>
              ) : (
                customers.map((c) => (
                  <div
                    key={c._id || c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className="p-2 hover:bg-indigo-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {c.state} {c.gstin ? `• GSTIN: ${c.gstin}` : ""}
                      </p>
                    </div>
                    {selectedCustomerId === (c._id || c.id) && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Editable inputs for Buyer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            {t("invoices.customerName", "Customer / Business Name")} *
          </label>
          <input
            type="text"
            required
            maxLength={120}
            value={buyer.name}
            onChange={(e) => {
              onSelectCustomerId?.(null);
              onChange({ ...buyer, name: e.target.value });
            }}
            placeholder="e.g. Tata Consultancy Services"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            {t("invoices.buyerGstin", "Customer GSTIN (Optional)")}
          </label>
          <input
            type="text"
            maxLength={15}
            value={buyer.gstin || ""}
            onChange={(e) => onChange({ ...buyer, gstin: e.target.value.toUpperCase() })}
            onBlur={(e) => handleGstinBlur(e.target.value)}
            placeholder="e.g. 27AAAAA0000A1Z5"
            className="w-full px-3 py-2 text-sm uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
          {gstinError && <p className="text-[11px] text-rose-500 mt-1">{gstinError}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            {t("invoices.billingAddress", "Billing Address")} *
          </label>
          <input
            type="text"
            required
            maxLength={300}
            value={buyer.address}
            onChange={(e) => onChange({ ...buyer, address: e.target.value })}
            placeholder="e.g. Level 3, Express Towers, Nariman Point, Mumbai"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            {t("invoices.placeOfSupply", "Place of Supply / State")} *
          </label>
          <select
            value={buyer.state}
            onChange={(e) => onChange({ ...buyer, state: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer"
          >
            {FALLBACK_GST_STATES.map((st) => (
              <option key={st.code} value={st.name}>
                {st.code} - {st.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            {t("invoices.clientEmail", "Email (Optional)")}
          </label>
          <input
            type="email"
            maxLength={120}
            value={buyer.email || ""}
            onChange={(e) => onChange({ ...buyer, email: e.target.value })}
            placeholder="finance@client.com"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>
      </div>

      {/* Save this customer checkbox if not selected from saved list */}
      {!selectedCustomerId && onSaveCustomerChange && (
        <label className="flex items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={saveCustomerChecked}
            onChange={(e) => onSaveCustomerChange(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 cursor-pointer"
          />
          <span>{t("invoices.saveCustomerForFuture", "Save this customer to my address book")}</span>
        </label>
      )}

      {/* Inline Modal: Add New Customer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {t("invoices.addNewCustomer", "Add New Customer")}
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("invoices.customerName", "Customer / Business Name")} *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  placeholder="e.g. Infotech Global Pvt Ltd"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("invoices.buyerGstin", "Customer GSTIN (Optional)")}
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={newCust.gstin}
                  onChange={(e) => setNewCust({ ...newCust, gstin: e.target.value.toUpperCase() })}
                  onBlur={(e) => handleGstinBlur(e.target.value)}
                  placeholder="27AAAAA0000A1Z5"
                  className="w-full px-3 py-2 text-sm uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
                {gstinError && <p className="text-[11px] text-rose-500 mt-1">{gstinError}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("invoices.billingAddress", "Billing Address")} *
                </label>
                <input
                  type="text"
                  required
                  maxLength={300}
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  placeholder="Plot 45, Sector 18, Cyber City"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("invoices.placeOfSupply", "State")} *
                </label>
                <select
                  value={newCust.state}
                  onChange={(e) => setNewCust({ ...newCust, state: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer"
                >
                  {FALLBACK_GST_STATES.map((st) => (
                    <option key={st.code} value={st.name}>
                      {st.code} - {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t("invoices.clientEmail", "Email")}
                  </label>
                  <input
                    type="email"
                    maxLength={120}
                    value={newCust.email}
                    onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                    placeholder="info@client.com"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {t("invoices.clientPhone", "Phone")}
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {creating ? t("common.saving", "Saving...") : t("common.save", "Save Customer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerSelect;
