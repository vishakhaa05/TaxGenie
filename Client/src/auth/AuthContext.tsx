import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  getMeApi,
  loginApi,
  registerApi,
  verifyOtpApi,
  resendOtpApi,
  logoutApi,
  updateProfileApi,
  changePasswordApi,
  deleteAccountApi,
} from "./api";
import { setCredentials, logout as reduxLogout, updateCredentials } from "@/features/auth/authSlice";
import { saveCalculationApi } from "@/features/calculations/api";
import { useTheme } from "@/context/theme-provider";

export interface AuthUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  language?: "en" | "hi";
  theme?: "light" | "dark" | "system";
  defaultState?: string;
  ageGroup?: string;
  preferences?: {
    language?: "en" | "hi";
    theme?: "light" | "dark" | "system";
    defaultState?: string;
    defaultAgeGroup?: string;
  };
}

export interface PendingSaveData {
  type: "income_tax" | "gst";
  inputs: Record<string, any>;
  name?: string;
  taxYear?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  register: (payload: { name: string; email: string; password: string }) => Promise<any>;
  verifyOtp: (payload: { email: string; otp: string }) => Promise<any>;
  resendOtp: (payload: { email: string }) => Promise<any>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<any>;
  changePassword: (data: { currentPassword: string; newPassword: string }) => Promise<any>;
  deleteAccount: (password: string) => Promise<any>;
  refreshUser: () => Promise<void>;
  storePendingSave: (data: PendingSaveData) => void;
  getPendingSave: () => PendingSaveData | null;
  clearPendingSave: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PENDING_SAVE_KEY = "taxgenie_pending_save";
const LOGOUT_SYNC_KEY = "taxgenie_logout_event";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const dispatch = useDispatch();
  const { i18n, t } = useTranslation();
  const { setTheme } = useTheme();

  // Helper to sync user preferences to UI
  const syncUserPreferences = useCallback(
    (userData: AuthUser) => {
      if (userData.language && (userData.language === "en" || userData.language === "hi")) {
        if (i18n.language !== userData.language) {
          i18n.changeLanguage(userData.language);
          localStorage.setItem("taxgenie_language", userData.language);
        }
      }
      if (userData.theme && (userData.theme === "light" || userData.theme === "dark" || userData.theme === "system")) {
        setTheme(userData.theme);
      }
    },
    [i18n, setTheme]
  );

  // Guest-to-account pending save helpers
  const storePendingSave = (data: PendingSaveData) => {
    try {
      sessionStorage.setItem(PENDING_SAVE_KEY, JSON.stringify(data));
    } catch {
      // Storage unavailable
    }
  };

  const getPendingSave = (): PendingSaveData | null => {
    try {
      const raw = sessionStorage.getItem(PENDING_SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const clearPendingSave = () => {
    try {
      sessionStorage.removeItem(PENDING_SAVE_KEY);
    } catch {}
  };

  // Automatically execute pending save once user logs in or verifies
  const processPendingSave = useCallback(
    async (loggedUser: AuthUser) => {
      const pending = getPendingSave();
      if (!pending) return;

      try {
        clearPendingSave();
        const res = await saveCalculationApi(pending);
        const item = res.data;
        const itemName = item?.name || "Calculation";
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sm">{t("history.saveSuccess") || "Calculation saved to your account!"}</span>
            <span className="text-xs text-slate-300">{itemName}</span>
            <a
              href={item?.type === "income_tax" ? `/income-tax/result?savedId=${item._id || item.id}` : `/gst?savedId=${item._id || item.id}`}
              className="text-xs text-indigo-400 underline font-medium mt-1"
            >
              {t("common.viewInHistory") || "View saved calculation &rarr;"}
            </a>
          </div>,
          { duration: 6000 }
        );
      } catch (err: any) {
        console.warn("Could not process pending save:", err);
      }
    },
    [t]
  );

  // Initialize and check current authentication session
  const initAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getMeApi();
      if (res?.data?.user) {
        const u = res.data.user;
        setUser(u);
        dispatch(
          setCredentials({
            accessToken: "cookie_managed",
            user: u,
            expiresAt: Date.now() + 15 * 60 * 1000,
          })
        );
        syncUserPreferences(u);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, syncUserPreferences]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Synchronize multi-tab logout
  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === LOGOUT_SYNC_KEY) {
        setUser(null);
        dispatch(reduxLogout());
        clearPendingSave();
      }
    };

    window.addEventListener("storage", handleStorageEvent);
    return () => window.removeEventListener("storage", handleStorageEvent);
  }, [dispatch]);

  // Login handler
  const login = async (credentials: { email: string; password: string }) => {
    const res = await loginApi(credentials);
    const u = res.data.user;
    setUser(u);
    dispatch(
      setCredentials({
        accessToken: res.data.accessToken || "cookie_managed",
        user: u,
        expiresAt: Date.now() + 15 * 60 * 1000,
      })
    );
    syncUserPreferences(u);
    await processPendingSave(u);
    return res;
  };

  // Register handler
  const register = async (payload: { name: string; email: string; password: string }) => {
    return registerApi(payload);
  };

  // OTP verify handler
  const verifyOtp = async (payload: { email: string; otp: string }) => {
    const res = await verifyOtpApi(payload);
    const u = res.data.user;
    setUser(u);
    dispatch(
      setCredentials({
        accessToken: res.data.accessToken || "cookie_managed",
        user: u,
        expiresAt: Date.now() + 15 * 60 * 1000,
      })
    );
    syncUserPreferences(u);
    await processPendingSave(u);
    return res;
  };

  // Resend OTP handler
  const resendOtp = async (payload: { email: string }) => {
    return resendOtpApi(payload);
  };

  // Logout handler
  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.warn("Logout API error:", e);
    } finally {
      setUser(null);
      dispatch(reduxLogout());
      clearPendingSave();
      try {
        localStorage.setItem(LOGOUT_SYNC_KEY, Date.now().toString());
      } catch {}
    }
  };

  // Profile update handler
  const updateProfile = async (data: Partial<AuthUser>) => {
    const res = await updateProfileApi(data);
    const updated = res.data.user || res.data;
    setUser((prev) => (prev ? { ...prev, ...updated } : updated));
    dispatch(updateCredentials({ user: updated }));
    syncUserPreferences(updated);
    return res;
  };

  // Change password handler
  const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
    return changePasswordApi(data);
  };

  // Delete account handler
  const deleteAccount = async (password: string) => {
    const res = await deleteAccountApi({ password });
    setUser(null);
    dispatch(reduxLogout());
    clearPendingSave();
    try {
      localStorage.setItem(LOGOUT_SYNC_KEY, Date.now().toString());
    } catch {}
    return res;
  };

  const refreshUser = useCallback(async () => {
    try {
      const me = await getMeApi();
      if (me) {
        setUser(me);
        dispatch(updateCredentials({ user: me }));
      }
    } catch {
      // ignore
    }
  }, [dispatch]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        updateProfile,
        changePassword,
        deleteAccount,
        refreshUser,
        storePendingSave,
        getPendingSave,
        clearPendingSave,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const defaultGuestAuth: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  verifyOtp: async () => {},
  resendOtp: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  changePassword: async () => {},
  deleteAccount: async () => {},
  refreshUser: async () => {},
  storePendingSave: () => {},
  getPendingSave: () => null,
  clearPendingSave: () => {},
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context || defaultGuestAuth;
}

