import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import PageLayout from "@/components/page-layout";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "@/features/invoices/api";
import { Customer } from "@/features/invoices/types";
import { FALLBACK_GST_STATES, validateGstinOnServer } from "@/features/gst/api";
import { toast } from "sonner";

export const CustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Customer | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    gstin: "",
    address: "",
    state: "Maharashtra",
    email: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [gstinValidating, setGstinValidating] = useState(false);
  const [gstinError, setGstinError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async (q?: string) => {
    try {
      setLoading(true);
      const res = await getCustomers(q);
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch {
      toast.error(t("invoices.failedToLoadCustomers", "Failed to load customers"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    loadCustomers(val);
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm({
      name: "",
      gstin: "",
      address: "",
      state: "Maharashtra",
      email: "",
      phone: "",
    });
    setGstinError(null);
    setShowModal(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setForm({
      name: c.name,
      gstin: c.gstin || "",
      address: c.address,
      state: c.state,
      email: c.email || "",
      phone: c.phone || "",
    });
    setGstinError(null);
    setShowModal(true);
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim() || !form.state) {
      toast.error(t("invoices.fillRequiredFields", "Please fill required fields"));
      return;
    }
    if (gstinError) {
      toast.error(gstinError);
      return;
    }

    try {
      setSubmitting(true);
      if (editingCustomer) {
        const id = editingCustomer._id || editingCustomer.id!;
        const res = await updateCustomer(id, form);
        if (res.success && res.data) {
          toast.success(t("invoices.customerUpdated", "Customer updated successfully"));
          setCustomers((prev) => prev.map((c) => ((c._id || c.id) === id ? res.data : c)));
          setShowModal(false);
        } else {
          toast.error(res.error || t("invoices.failedToUpdateCustomer", "Failed to update customer"));
        }
      } else {
        const res = await createCustomer(form);
        if (res.success && res.data) {
          toast.success(t("invoices.customerCreated", "Customer added successfully"));
          setCustomers((prev) => [res.data, ...prev]);
          setShowModal(false);
        } else {
          toast.error(res.error || t("invoices.failedToCreateCustomer", "Failed to create customer"));
        }
      }
    } catch (err: any) {
      toast.error(err.message || t("invoices.failedToSaveCustomer", "Failed to save customer"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    const id = deleteCandidate._id || deleteCandidate.id!;
    try {
      const res = await deleteCustomer(id);
      if (res.success) {
        toast.success(t("invoices.customerDeleted", "Customer removed from address book"));
        setCustomers((prev) => prev.filter((c) => (c._id || c.id) !== id));
      } else {
        toast.error(res.error || t("invoices.failedToDeleteCustomer", "Failed to delete customer"));
      }
    } catch (err: any) {
      toast.error(err.message || t("invoices.failedToDeleteCustomer", "Failed to delete customer"));
    } finally {
      setDeleteCandidate(null);
    }
  };

  return (
    <PageLayout
      title={t("invoices.customersTitle", "Customers & Clients")}
      subtitle={t(
        "invoices.customersSubtitle",
        "Manage your client address book for faster, error-free invoice creation."
      )}
      addMarginTop
      rightAction={
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t("invoices.addNewCustomer", "Add New Customer")}</span>
        </button>
      }
    >
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t("invoices.searchCustomersPlaceholder", "Search customers by name...")}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="text-xs text-slate-500 self-end sm:self-center">
            {t("invoices.totalCustomersCount", "{{count}} customers saved", { count: customers.length })}
          </div>
        </div>

        {/* Customer Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3 animate-pulse"
              >
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-2/3"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
                <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-md w-full"></div>
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
              {t("invoices.noCustomersYet", "No customers saved yet")}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {t(
                "invoices.noCustomersDescription",
                "Save your frequent clients once to prefill invoices automatically with valid place of supply and GSTIN."
              )}
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t("invoices.addFirstCustomer", "Add Your First Customer")}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customers.map((c) => (
              <div
                key={c._id || c.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800 transition-all group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {c.name}
                    </h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCandidate(c)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {c.gstin && (
                    <div className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-semibold">
                      GSTIN: {c.gstin}
                    </div>
                  )}

                  <div className="pt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <p className="line-clamp-2">
                        {c.address}, {c.state}
                      </p>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {editingCustomer
                  ? t("invoices.editCustomer", "Edit Customer")
                  : t("invoices.addNewCustomer", "Add New Customer")}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.customerName", "Customer / Business Name")} *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Reliance Retail Ventures"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.buyerGstin", "Customer GSTIN (Optional)")}
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={form.gstin}
                  onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                  onBlur={(e) => handleGstinBlur(e.target.value)}
                  placeholder="27AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2 text-sm uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
                {gstinValidating && <p className="text-[11px] text-indigo-500 mt-1">Validating GSTIN...</p>}
                {gstinError && <p className="text-[11px] text-rose-500 mt-1">{gstinError}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.billingAddress", "Billing Address")} *
                </label>
                <textarea
                  rows={2}
                  required
                  maxLength={300}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="e.g. 5th Floor, Maker Chambers IV, Nariman Point, Mumbai"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("invoices.placeOfSupply", "Place of Supply / State")} *
                </label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden cursor-pointer"
                >
                  {FALLBACK_GST_STATES.map((st) => (
                    <option key={st.code} value={st.name}>
                      {st.code} - {st.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("invoices.clientEmail", "Email")}
                  </label>
                  <input
                    type="email"
                    maxLength={120}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="billing@client.com"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t("invoices.clientPhone", "Phone")}
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? t("common.saving", "Saving...") : t("common.save", "Save Customer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {t("invoices.deleteCustomerTitle", "Delete Customer?")}
              </h4>
              <p className="text-xs text-slate-500">
                {t(
                  "invoices.deleteCustomerDesc",
                  "Are you sure you want to delete {{name}}? Existing invoices will preserve the customer snapshot and won't be affected.",
                  { name: deleteCandidate.name }
                )}
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                {t("common.delete", "Delete Customer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
export default CustomersPage;
