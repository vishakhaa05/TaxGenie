import bcryptjs from "bcryptjs";

const BCRYPT_SALT_ROUNDS = 12;

// Deny-list of common, easily guessed passwords
export const COMMON_PASSWORD_DENY_LIST = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwertyuiop",
  "qwerty123",
  "admin123",
  "welcome123",
  "taxgenie",
  "taxgenie123",
  "iloveyou",
  "secret123",
  "changeme",
  "monkey123",
  "dragon123",
  "football",
  "master123",
  "sunshine",
  "princess",
  "superman",
]);

export interface PasswordValidationResult {
  isValid: boolean;
  messageKey?: string;
  defaultMessage?: string;
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      messageKey: "errors.passwordMinLength",
      defaultMessage: "Password must be at least 8 characters long.",
    };
  }

  // Must not be only digits
  if (/^\d+$/.test(password)) {
    return {
      isValid: false,
      messageKey: "errors.passwordNotOnlyDigits",
      defaultMessage: "Password cannot consist solely of numbers.",
    };
  }

  // Deny-list check
  if (COMMON_PASSWORD_DENY_LIST.has(password.toLowerCase().trim())) {
    return {
      isValid: false,
      messageKey: "errors.passwordTooCommon",
      defaultMessage: "This password is too common and easily guessed. Please pick a stronger password.",
    };
  }

  return { isValid: true };
}

export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcryptjs.genSalt(BCRYPT_SALT_ROUNDS);
  return bcryptjs.hash(plainPassword, salt);
}

export async function comparePassword(plainPassword: string, hash: string): Promise<boolean> {
  if (!plainPassword || !hash) return false;
  return bcryptjs.compare(plainPassword, hash);
}
