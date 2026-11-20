import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  deleteUserAndAllData,
  saveOtp,
  findLatestOtp,
  updateOtpAttempts,
  deleteOtp,
  saveRefreshToken,
  findRefreshTokenByHash,
  revokeToken,
  revokeFamily,
  revokeAllUserSessions,
  savePasswordReset,
  findPasswordResetByHash,
  markPasswordResetUsed,
} from "../utils/localStore";
import { hashPassword, comparePassword } from "../utils/password";
import { generateOtp, hashSha256, generateRandomToken, generateFamilyId } from "../utils/crypto";
import { signJwtToken, refreshTokenSignOptions } from "../utils/jwt";
import {
  sendVerificationOtpEmail,
  sendPasswordResetEmail,
  sendPasswordChangedNoticeEmail,
} from "./email.service";
import {
  RegisterSchemaType,
  VerifyOtpSchemaType,
  ResendOtpSchemaType,
  LoginSchemaType,
  ForgotPasswordSchemaType,
  ResetPasswordSchemaType,
  UpdateProfileSchemaType,
  ChangePasswordSchemaType,
} from "../validators/auth.validator";

export const GENERIC_AUTH_SUCCESS_MSG =
  "If your email address is valid, instructions have been sent.";

/**
 * 1. Register Service (Generic message, no enumeration)
 */
export async function registerService(body: RegisterSchemaType): Promise<{
  success: boolean;
  message: string;
  email: string;
}> {
  const { name, email, password } = body;
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    if (existingUser.isEmailVerified) {
      // Generic success to prevent account enumeration
      return {
        success: true,
        message: "A verification code has been sent to your email address.",
        email: normalizedEmail,
      };
    }

    // Unverified user requesting register again: generate fresh OTP and resend
    const otp = generateOtp();
    const codeHash = hashSha256(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await saveOtp({
      userId: existingUser._id || existingUser.id,
      email: normalizedEmail,
      purpose: "verify_email",
      codeHash,
      expiresAt,
    });

    await sendVerificationOtpEmail(normalizedEmail, existingUser.name, otp, existingUser.language || "en");

    return {
      success: true,
      message: "A verification code has been sent to your email address.",
      email: normalizedEmail,
    };
  }

  // Hash password with bcryptjs cost 12
  const passwordHash = await hashPassword(password);

  const newUser = await createUser({
    name,
    email: normalizedEmail,
    passwordHash,
    isEmailVerified: false,
    language: "en",
    theme: "system",
    defaultState: "27",
    ageGroup: "general",
  });

  const otp = generateOtp();
  const codeHash = hashSha256(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await saveOtp({
    userId: newUser._id || newUser.id,
    email: normalizedEmail,
    purpose: "verify_email",
    codeHash,
    expiresAt,
  });

  await sendVerificationOtpEmail(normalizedEmail, newUser.name, otp, "en");

  return {
    success: true,
    message: "A verification code has been sent to your email address.",
    email: normalizedEmail,
  };
}

/**
 * 2. Verify OTP Service
 */
export async function verifyOtpService(body: VerifyOtpSchemaType): Promise<{
  user: any;
  accessToken: string;
  refreshToken: string;
}> {
  const { email, otp } = body;
  const normalizedEmail = email.toLowerCase().trim();

  const otpRecord = await findLatestOtp(normalizedEmail, "verify_email");

  if (!otpRecord) {
    throw {
      statusCode: 400,
      code: "OTP_EXPIRED_OR_INVALID",
      message: "Verification code has expired or is invalid. Please request a new one.",
    };
  }

  // Check TTL expiry
  if (new Date(otpRecord.expiresAt).getTime() < Date.now()) {
    await deleteOtp(otpRecord._id);
    throw {
      statusCode: 400,
      code: "OTP_EXPIRED",
      message: "Verification code has expired. Please request a new one.",
    };
  }

  // Check max attempts
  if (otpRecord.attempts >= 5) {
    await deleteOtp(otpRecord._id);
    throw {
      statusCode: 400,
      code: "TOO_MANY_ATTEMPTS",
      message: "Maximum verification attempts exceeded. Please request a fresh OTP.",
    };
  }

  // Verify hash
  const inputHash = hashSha256(otp);
  if (inputHash !== otpRecord.codeHash) {
    const newAttempts = (otpRecord.attempts || 0) + 1;
    await updateOtpAttempts(otpRecord._id, newAttempts);
    const remaining = Math.max(0, 5 - newAttempts);
    throw {
      statusCode: 400,
      code: "INVALID_OTP",
      message: `Incorrect verification code. ${remaining} attempt(s) remaining.`,
    };
  }

  // Valid OTP: delete OTP record and verify user
  await deleteOtp(otpRecord._id);

  let user = await findUserByEmail(normalizedEmail);
  if (!user) {
    throw {
      statusCode: 404,
      code: "USER_NOT_FOUND",
      message: "Account not found.",
    };
  }

  user = await updateUser(user._id || user.id, { isEmailVerified: true });

  const userId = String(user._id || user.id);
  const { token: accessToken } = signJwtToken({ userId });
  const { token: refreshToken } = signJwtToken({ userId }, refreshTokenSignOptions);

  const familyId = generateFamilyId();
  const tokenHash = hashSha256(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await saveRefreshToken({
    userId,
    tokenHash,
    familyId,
    expiresAt,
  });

  return {
    user: typeof user.omitPassword === "function" ? user.omitPassword() : user,
    accessToken,
    refreshToken,
  };
}

/**
 * 3. Resend OTP Service
 */
export async function resendOtpService(body: ResendOtpSchemaType): Promise<{
  success: boolean;
  message: string;
}> {
  const { email } = body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await findUserByEmail(normalizedEmail);
  if (!user || user.isEmailVerified) {
    return {
      success: true,
      message: "If your email is registered and unverified, a new code has been sent.",
    };
  }

  const existingOtp = await findLatestOtp(normalizedEmail, "verify_email");
  const now = Date.now();

  if (existingOtp) {
    const lastSent = new Date(existingOtp.lastSentAt).getTime();
    const windowStart = new Date(existingOtp.windowStartTime || existingOtp.lastSentAt).getTime();

    // 60-second cooldown
    if (now - lastSent < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
      throw {
        statusCode: 429,
        code: "RESEND_COOLDOWN",
        message: `Please wait ${waitSeconds} seconds before requesting another code.`,
      };
    }

    // 5 sends per hour rate limit
    if (now - windowStart < 60 * 60 * 1000) {
      if (existingOtp.sendCountWindow >= 5) {
        throw {
          statusCode: 429,
          code: "HOURLY_LIMIT_EXCEEDED",
          message: "Maximum hourly OTP requests reached. Please try again after an hour.",
        };
      }
    }
  }

  const otp = generateOtp();
  const codeHash = hashSha256(otp);
  const expiresAt = new Date(now + 10 * 60 * 1000);

  await saveOtp({
    userId: user._id || user.id,
    email: normalizedEmail,
    purpose: "verify_email",
    codeHash,
    expiresAt,
  });

  await sendVerificationOtpEmail(normalizedEmail, user.name, otp, user.language || "en");

  return {
    success: true,
    message: "A fresh verification code has been sent to your email address.",
  };
}

/**
 * 4. Login Service
 */
export async function loginService(
  body: LoginSchemaType,
  metadata: { userAgent?: string; ip?: string } = {}
): Promise<{
  user: any;
  accessToken: string;
  refreshToken: string;
}> {
  const { email, password } = body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await findUserByEmail(normalizedEmail);

  // Generic error to prevent email enumeration
  if (!user) {
    throw {
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    };
  }

  // Check lockout
  if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
    const remainingMinutes = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / (60 * 1000));
    throw {
      statusCode: 423,
      code: "ACCOUNT_LOCKED",
      message: `Account is temporarily locked. Please try again in ${remainingMinutes} minute(s).`,
    };
  }

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    const failedCount = (user.failedLoginCount || 0) + 1;
    let lockUntil: Date | null = null;

    if (failedCount >= 5) {
      lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }

    await updateUser(user._id || user.id, {
      failedLoginCount: lockUntil ? 0 : failedCount,
      lockUntil,
    });

    if (lockUntil) {
      throw {
        statusCode: 423,
        code: "ACCOUNT_LOCKED",
        message: "Account locked due to 5 failed login attempts. Please try again in 15 minutes.",
      };
    }

    throw {
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password.",
    };
  }

  // Password correct: reset failed login count
  if (user.failedLoginCount > 0 || user.lockUntil) {
    await updateUser(user._id || user.id, { failedLoginCount: 0, lockUntil: null });
  }

  // Block login if email is unverified
  if (!user.isEmailVerified) {
    throw {
      statusCode: 403,
      code: "EMAIL_NOT_VERIFIED",
      message: "Please verify your email address before logging in.",
      email: normalizedEmail,
    };
  }

  const userId = String(user._id || user.id);
  const { token: accessToken } = signJwtToken({ userId });
  const { token: refreshToken } = signJwtToken({ userId }, refreshTokenSignOptions);

  const familyId = generateFamilyId();
  const tokenHash = hashSha256(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await saveRefreshToken({
    userId,
    tokenHash,
    familyId,
    expiresAt,
    userAgent: metadata.userAgent,
    ip: metadata.ip,
  });

  return {
    user: typeof user.omitPassword === "function" ? user.omitPassword() : user,
    accessToken,
    refreshToken,
  };
}

/**
 * 5. Refresh Token Service (Token rotation + family revocation on reuse)
 */
export async function refreshTokenService(
  tokenInput: string,
  metadata: { userAgent?: string; ip?: string } = {}
): Promise<{
  accessToken: string;
  refreshToken: string;
  user: any;
}> {
  if (!tokenInput) {
    throw {
      statusCode: 401,
      code: "MISSING_TOKEN",
      message: "Refresh token is missing.",
    };
  }

  const tokenHash = hashSha256(tokenInput);
  const tokenRecord = await findRefreshTokenByHash(tokenHash);

  if (!tokenRecord) {
    throw {
      statusCode: 401,
      code: "INVALID_TOKEN",
      message: "Invalid or expired session.",
    };
  }

  // Detect token reuse: if already revoked, revoke the entire session family!
  if (tokenRecord.revokedAt) {
    await revokeFamily(tokenRecord.familyId);
    throw {
      statusCode: 401,
      code: "SESSION_COMPROMISED",
      message: "Security warning: Session reuse detected. All active sessions have been terminated.",
    };
  }

  // Check expiration
  if (new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
    throw {
      statusCode: 401,
      code: "TOKEN_EXPIRED",
      message: "Your session has expired. Please log in again.",
    };
  }

  const user = await findUserById(String(tokenRecord.userId));
  if (!user) {
    throw {
      statusCode: 401,
      code: "USER_NOT_FOUND",
      message: "User account no longer exists.",
    };
  }

  // Revoke the old token (rotation)
  await revokeToken(tokenHash);

  // Issue new access and refresh token under the same familyId
  const userId = String(user._id || user.id);
  const { token: newAccessToken } = signJwtToken({ userId });
  const { token: newRefreshToken } = signJwtToken({ userId }, refreshTokenSignOptions);

  const newTokenHash = hashSha256(newRefreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await saveRefreshToken({
    userId,
    tokenHash: newTokenHash,
    familyId: tokenRecord.familyId,
    expiresAt,
    userAgent: metadata.userAgent,
    ip: metadata.ip,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: typeof user.omitPassword === "function" ? user.omitPassword() : user,
  };
}

/**
 * 6. Logout Service
 */
export async function logoutService(refreshTokenInput?: string): Promise<boolean> {
  if (refreshTokenInput) {
    const tokenHash = hashSha256(refreshTokenInput);
    await revokeToken(tokenHash);
  }
  return true;
}

/**
 * 7. Logout All Service (revokes all sessions)
 */
export async function logoutAllService(userId: string): Promise<boolean> {
  await revokeAllUserSessions(userId);
  return true;
}

/**
 * 8. Forgot Password Service (Generic message, no enumeration)
 */
export async function forgotPasswordService(body: ForgotPasswordSchemaType): Promise<{
  success: boolean;
  message: string;
}> {
  const { email } = body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    return {
      success: true,
      message: "If an account exists with this email, password reset instructions have been sent.",
    };
  }

  const rawToken = generateRandomToken(32);
  const tokenHash = hashSha256(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await savePasswordReset({
    userId: String(user._id || user.id),
    email: normalizedEmail,
    tokenHash,
    expiresAt,
  });

  await sendPasswordResetEmail(normalizedEmail, user.name, rawToken, user.language || "en");

  return {
    success: true,
    message: "If an account exists with this email, password reset instructions have been sent.",
  };
}

/**
 * 9. Reset Password Service
 */
export async function resetPasswordService(body: ResetPasswordSchemaType): Promise<{
  success: boolean;
  message: string;
}> {
  const { token, newPassword } = body;
  const tokenHash = hashSha256(token);

  const resetRecord = await findPasswordResetByHash(tokenHash);

  if (!resetRecord || resetRecord.usedAt) {
    throw {
      statusCode: 400,
      code: "INVALID_RESET_TOKEN",
      message: "Password reset link is invalid or has already been used.",
    };
  }

  if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
    throw {
      statusCode: 400,
      code: "RESET_TOKEN_EXPIRED",
      message: "Password reset link has expired. Please request a new one.",
    };
  }

  const user = await findUserById(String(resetRecord.userId));
  if (!user) {
    throw {
      statusCode: 404,
      code: "USER_NOT_FOUND",
      message: "User account not found.",
    };
  }

  const hashedPassword = await hashPassword(newPassword);

  await updateUser(String(user._id || user.id), {
    password: hashedPassword,
    failedLoginCount: 0,
    lockUntil: null,
  });

  await markPasswordResetUsed(resetRecord._id);

  // Security rule: revoke all existing sessions on password reset
  await revokeAllUserSessions(String(user._id || user.id));

  // Send security confirmation email
  await sendPasswordChangedNoticeEmail(user.email, user.name, user.language || "en");

  return {
    success: true,
    message: "Your password has been reset successfully. Please log in with your new password.",
  };
}

/**
 * 10. Update Profile Service
 */
export async function updateProfileService(
  userId: string,
  body: UpdateProfileSchemaType
): Promise<any> {
  const user = await findUserById(userId);
  if (!user) {
    throw {
      statusCode: 404,
      code: "USER_NOT_FOUND",
      message: "User not found.",
    };
  }

  const updates: Record<string, any> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.language !== undefined) updates.language = body.language;
  if (body.theme !== undefined) updates.theme = body.theme;
  if (body.defaultState !== undefined) updates.defaultState = body.defaultState;
  if (body.ageGroup !== undefined) updates.ageGroup = body.ageGroup;

  const updated = await updateUser(userId, updates);
  return typeof updated.omitPassword === "function" ? updated.omitPassword() : updated;
}

/**
 * 11. Change Password Service
 */
export async function changePasswordService(
  userId: string,
  body: ChangePasswordSchemaType
): Promise<{ success: boolean; message: string }> {
  const { currentPassword, newPassword } = body;
  const user = await findUserById(userId);

  if (!user) {
    throw {
      statusCode: 404,
      code: "USER_NOT_FOUND",
      message: "User not found.",
    };
  }

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    throw {
      statusCode: 400,
      code: "INVALID_CURRENT_PASSWORD",
      message: "Your current password does not match.",
    };
  }

  const hashedPassword = await hashPassword(newPassword);
  await updateUser(userId, { password: hashedPassword });

  // Revoke all other sessions (keep current or revoke all)
  await revokeAllUserSessions(userId);

  await sendPasswordChangedNoticeEmail(user.email, user.name, user.language || "en");

  return {
    success: true,
    message: "Password changed successfully. All other sessions have been signed out.",
  };
}

/**
 * 12. Delete Account Service (Deletes user and ALL related data)
 */
export async function deleteAccountService(
  userId: string,
  passwordConfirm: string
): Promise<{ success: boolean; message: string }> {
  const user = await findUserById(userId);
  if (!user) {
    throw {
      statusCode: 404,
      code: "USER_NOT_FOUND",
      message: "User not found.",
    };
  }

  const isValid = await comparePassword(passwordConfirm, user.password);
  if (!isValid) {
    throw {
      statusCode: 400,
      code: "INVALID_PASSWORD",
      message: "Password confirmation does not match.",
    };
  }

  await deleteUserAndAllData(userId);

  return {
    success: true,
    message: "Your account and all associated calculations have been permanently deleted.",
  };
}
