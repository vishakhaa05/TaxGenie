const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

let isRefreshing = false;
let refreshSubscribers: Array<(refreshed: boolean) => void> = [];

function onRefreshed(refreshed: boolean) {
  refreshSubscribers.forEach((cb) => cb(refreshed));
  refreshSubscribers = [];
}

/**
 * Universal API fetch client with automatic CSRF header, httpOnly cookie credentials,
 * and single-retry transparent token refresh upon 401 Unauthorized responses.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; error?: { code: string; message: string } }> {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    "x-requested-with": "XMLHttpRequest",
    "x-taxgenie-csrf": "1",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
  };

  const config: RequestInit = {
    ...options,
    credentials: "include", // Required for httpOnly access & refresh cookies
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    let res = await fetch(url, config);

    // If 401 Unauthorized, attempt a silent token refresh (unless this IS a refresh or login request)
    if (res.status === 401 && !url.includes("/auth/refresh") && !url.includes("/auth/login") && !url.includes("/auth/register")) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: {
              "x-requested-with": "XMLHttpRequest",
              "x-taxgenie-csrf": "1",
            },
          });

          if (refreshRes.ok) {
            isRefreshing = false;
            onRefreshed(true);
            // Retry original request
            res = await fetch(url, config);
          } else {
            isRefreshing = false;
            onRefreshed(false);
          }
        } catch {
          isRefreshing = false;
          onRefreshed(false);
        }
      } else {
        // Wait for active refresh to complete
        const refreshed = await new Promise<boolean>((resolve) => {
          refreshSubscribers.push(resolve);
        });
        if (refreshed) {
          res = await fetch(url, config);
        }
      }
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(json?.error?.message || json?.message || `Request failed with status ${res.status}`);
      (err as any).status = res.status;
      (err as any).code = json?.error?.code || json?.errorCode || "REQUEST_FAILED";
      (err as any).data = json;
      throw err;
    }

    return json;
  } catch (error: any) {
    throw error;
  }
}

// -----------------------------------------------------------------------------
// AUTH ENDPOINTS
// -----------------------------------------------------------------------------

export async function registerApi(payload: { name: string; email: string; password: string }) {
  return apiFetch<{ email: string; message: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyOtpApi(payload: { email: string; otp: string }) {
  return apiFetch<{ user: any; accessToken: string }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resendOtpApi(payload: { email: string }) {
  return apiFetch<{ message: string }>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginApi(payload: { email: string; password: string }) {
  return apiFetch<{ user: any; accessToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function refreshApi() {
  return apiFetch<{ user: any; accessToken: string }>("/auth/refresh", {
    method: "POST",
  });
}

export async function logoutApi() {
  return apiFetch<{ message: string }>("/auth/logout", {
    method: "POST",
  });
}

export async function logoutAllApi() {
  return apiFetch<{ message: string }>("/auth/logout-all", {
    method: "POST",
  });
}

export async function forgotPasswordApi(payload: { email: string }) {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetPasswordApi(payload: { token: string; newPassword: string }) {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMeApi() {
  return apiFetch<{ user: any }>("/auth/me", {
    method: "GET",
  });
}

// -----------------------------------------------------------------------------
// USER PROFILE & ACCOUNT MANAGEMENT
// -----------------------------------------------------------------------------

export async function updateProfileApi(payload: {
  name?: string;
  language?: "en" | "hi";
  theme?: "light" | "dark" | "system";
  defaultState?: string;
  ageGroup?: string;
}) {
  return apiFetch<{ user: any; message: string }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function changePasswordApi(payload: { currentPassword: string; newPassword: string }) {
  return apiFetch<{ message: string }>("/users/me/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteAccountApi(payload: { password: string }) {
  return apiFetch<{ message: string }>("/users/me", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
}
