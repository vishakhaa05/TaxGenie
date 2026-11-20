import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  ShieldCheck,
  Palette,
  Globe,
  MapPin,
  Calendar,
  Lock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth/useAuth";
import { updateProfileApi, changePasswordApi, deleteAccountApi } from "@/auth/api";
import { useTheme } from "@/context/theme-provider";
import { PasswordStrengthMeter } from "@/pages/auth/_component/PasswordStrengthMeter";
import { FALLBACK_GST_STATES } from "@/features/gst/api";

export const ProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile info state
  const [name, setName] = useState(user?.name || "");
  const [isSavingName, setIsSavingName] = useState(false);

  // Preferences state
  const [preferredLang, setPreferredLang] = useState<"en" | "hi">(
    user?.preferences?.language || (i18n.language.startsWith("hi") ? "hi" : "en")
  );
  const [preferredTheme, setPreferredTheme] = useState<"light" | "dark" | "system">(
    user?.preferences?.theme || (theme as "light" | "dark" | "system") || "system"
  );
  const [defaultState, setDefaultState] = useState(user?.preferences?.defaultState || "27");
  const [ageGroup, setAgeGroup] = useState(user?.preferences?.defaultAgeGroup || "<60");
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Handle Save Name
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error(t("account.nameMinLength", "Name must be at least 2 characters"));
      return;
    }

    setIsSavingName(true);
    try {
      await updateProfileApi({ name: name.trim() });
      await refreshUser();
      toast.success(t("account.nameUpdated", "Name updated successfully"));
    } catch (err: any) {
      toast.error(err?.message || t("account.updateFailed", "Failed to update profile"));
    } finally {
      setIsSavingName(false);
    }
  };

  // Handle Save Preferences
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    try {
      await updateProfileApi({
        language: preferredLang,
        theme: preferredTheme,
        defaultState,
        ageGroup,
      });

      // Synchronize client app state
      i18n.changeLanguage(preferredLang);
      setTheme(preferredTheme);

      await refreshUser();
      toast.success(t("account.prefsUpdated", "Preferences updated successfully"));
    } catch (err: any) {
      toast.error(err?.message || t("account.prefsFailed", "Failed to update preferences"));
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error(t("account.enterCurrentPassword", "Please enter your current password"));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t("auth.passwordMinLength", "New password must be at least 8 characters long"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("auth.passwordsDoNotMatch", "New passwords do not match"));
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePasswordApi({ currentPassword, newPassword });
      toast.success(t("account.passwordChanged", "Password changed successfully"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || t("account.passwordFailed", "Failed to change password"));
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error(t("account.enterPasswordConfirm", "Please enter your password to confirm deletion"));
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccountApi({ password: deletePassword });
      toast.success(t("account.accountDeleted", "Account deleted successfully"));
      await logout();
      navigate("/");
    } catch (err: any) {
      toast.error(err?.message || t("account.deleteFailed", "Failed to delete account"));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t("account.title", "Account Profile & Preferences")}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("account.subtitle", "Manage your profile details, statutory tax calculation defaults, and security.")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* CARD 1: Personal Info */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("account.personalInfo", "Personal Information")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("account.personalInfoDesc", "Your display identity across TaxGenie reports and invoices.")}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveName} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("auth.fullName", "Full Name")}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("auth.email", "Email Address")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full pl-10 pr-28 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed select-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3" />
                    {t("account.verified", "Verified")}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {t("account.emailReadonlyNote", "Email is tied to your cryptographic security and cannot be changed.")}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingName}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-500/20"
              >
                {isSavingName ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("common.saving", "Saving...")}</span>
                  </>
                ) : (
                  <span>{t("common.saveChanges", "Save Changes")}</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* CARD 2: Preferences */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("account.preferences", "Calculator & Display Preferences")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t(
                  "account.preferencesDesc",
                  "Default settings to speed up your tax calculations. Does not overwrite manual entries."
                )}
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Language */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t("account.language", "Default Language")}</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreferredLang("en")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                      preferredLang === "en"
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredLang("hi")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                      preferredLang === "hi"
                        ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    हिन्दी (Hindi)
                  </button>
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t("account.theme", "Interface Theme")}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["light", "dark", "system"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPreferredTheme(mode)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-semibold border capitalize transition-all cursor-pointer text-center ${
                        preferredTheme === mode
                          ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold"
                          : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {t(`account.theme_${mode}`, mode)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default State */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t("account.defaultState", "Default State / UT for GST")}</span>
                </label>
                <select
                  value={defaultState}
                  onChange={(e) => setDefaultState(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {FALLBACK_GST_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Default Age Group */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t("account.defaultAgeGroup", "Default Age Category (Income Tax)")}</span>
                </label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="<60">{t("account.ageRegular", "Below 60 Years (General Individual)")}</option>
                  <option value="60-80">{t("account.ageSenior", "60 to 79 Years (Senior Citizen)")}</option>
                  <option value="80+">{t("account.ageSuperSenior", "80 Years and Above (Super Senior)")}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingPrefs}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-500/20"
              >
                {isSavingPrefs ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("common.saving", "Saving...")}</span>
                  </>
                ) : (
                  <span>{t("account.savePreferences", "Save Preferences")}</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* CARD 3: Change Password */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t("account.security", "Security & Password")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("account.securityDesc", "Update your account password with cryptographic protection.")}
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t("account.currentPassword", "Current Password")}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t("account.newPassword", "New Password")}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="mt-2">
                <PasswordStrengthMeter password={newPassword} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t("account.confirmNewPassword", "Confirm New Password")}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-500/20"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("account.updatingPassword", "Updating...")}</span>
                  </>
                ) : (
                  <span>{t("account.changePassword", "Update Password")}</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* CARD 4: Danger Zone */}
        <div className="p-6 rounded-2xl bg-rose-50/30 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/50 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-900 dark:text-rose-200">
                {t("account.dangerZone", "Danger Zone")}
              </h2>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
                {t(
                  "account.dangerDesc",
                  "Permanently delete your TaxGenie account, saved tax calculations, and preferences."
                )}
              </p>
            </div>
          </div>

          {!deleteConfirmOpen ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t("account.deleteAccount", "Delete Account")}</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  {t(
                    "account.deleteWarning",
                    "This action is irreversible. All your saved calculations and history will be permanently deleted."
                  )}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("account.confirmPasswordLabel", "Please enter your password to confirm:")}
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-rose-600/20"
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t("account.deleting", "Deleting...")}</span>
                    </>
                  ) : (
                    <span>{t("account.confirmDelete", "Yes, Delete My Account")}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setDeletePassword("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {t("common.cancel", "Cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
