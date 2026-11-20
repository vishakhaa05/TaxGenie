# TaxGenie Authentication Architecture (Phase 5)

## Overview
TaxGenie's authentication system is built for Indian taxpayers, freelancers, and businesses with institutional-grade cryptographic security, zero password leakage, session family rotation, and strict CSRF protection.

---

## 1. Security Architecture & Cryptography

### Passwords
- **Algorithm:** `bcryptjs` with salt work factor of **12**.
- **Password Policy:** Minimum 8 characters, maximum 128 characters.
- **Common Password Denylist:** Blocks weak dictionary passwords (e.g., `password123`, `admin123`, `qwertyuiop`).

### Token Lifecycle & Dual Token Cookies
- **Access Token:** Short-lived JWT (15-minute expiration) containing `{ id, email, role }`. Signed with `JWT_ACCESS_SECRET`.
- **Refresh Token:** Long-lived JWT (7-day expiration) containing `{ id, sessionId, familyId }`. Signed with `JWT_REFRESH_SECRET`.
- **Storage:** Both tokens are transmitted strictly via `httpOnly`, `SameSite=Lax` cookies with `Secure` flag enabled in production.
  - In development on `localhost`, the domain attribute is omitted to conform to RFC 6265 single-label rules.
- **Token Rotation & Reuse Detection:**
  - Upon every `/api/auth/refresh` invocation, the current refresh token is invalidated and a fresh refresh token is issued.
  - If a previously used refresh token is presented again (indicating token compromise or replay attack), the entire session family is instantly revoked, forcing immediate re-authentication.

### CSRF Defense
- Dual custom header verification: incoming mutation requests must include either `x-requested-with: XMLHttpRequest` or `x-taxgenie-csrf: 1`.
- Browsers disallow cross-origin requests from forging custom headers without preflight approval, preventing cross-site request forgery attacks.

---

## 2. One-Time Passwords (OTP) & Email Verification

- **Format:** 6-digit cryptographically secure numeric OTP (`crypto.randomInt(100000, 1000000)`).
- **TTL (Time to Live):** 10 minutes.
- **Attempt Limit:** Maximum 5 failed attempts per OTP before the code is permanently invalidated.
- **Cooldown:** 60-second cooldown period between successive OTP dispatch requests.
- **Hourly Rate Limit:** Maximum 5 OTP requests per email address within an hour.
- **Email Delivery:** Utilizes `nodemailer` in production with automated fallback to an in-memory/JSON audit log during development and testing.

---

## 3. Password Reset Flow

- Generates a 32-byte cryptographically secure random hexadecimal token (`crypto.randomBytes(32).toString('hex')`).
- Reset links point to `${CLIENT_URL}/reset-password?token=${token}` with a 1-hour expiration window.
- **Generic Responses (No Account Enumeration):** Requesting a password reset for an unregistered email returns an identical HTTP 200 generic success message to prevent user enumeration.

---

## 4. Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register user with name, email, password; sends 6-digit OTP | Public |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit OTP and issue cookies | Public |
| `POST` | `/api/auth/resend-otp` | Resend verification code (subject to 60s cooldown) | Public |
| `POST` | `/api/auth/login` | Authenticate email & password; returns 403 `EMAIL_NOT_VERIFIED` if unverified | Public |
| `POST` | `/api/auth/refresh` | Rotate access & refresh cookies silently | Refresh Cookie |
| `POST` | `/api/auth/logout` | Revoke current session and clear cookies | Auth Required |
| `POST` | `/api/auth/logout-all` | Revoke all active sessions across all devices | Auth Required |
| `POST` | `/api/auth/forgot-password` | Request password reset token via email | Public |
| `POST` | `/api/auth/reset-password` | Reset password using 32-byte token | Public |
| `GET` | `/api/auth/me` | Return active authenticated user profile | Auth Required |

---

## 5. Storage Fallback
The system uses MongoDB when `MONGODB_URI` is reachable. When MongoDB is unavailable or running in offline development mode, the local JSON store (`localStore.ts`) transparently stores users, OTPs, refresh tokens, and password reset records in `Backend/src/data/`.
