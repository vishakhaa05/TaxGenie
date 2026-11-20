import { Request, Response, NextFunction } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { verifyJwtToken } from "../utils/jwt";
import { Env } from "../config/env.config";
import { findUserById } from "../utils/localStore";

// Security middlewares for TaxGenie Authentication

/**
 * Middleware: requireAuth
 * Extracts short-lived access token from httpOnly cookie or Authorization header.
 * Attaches user to req.user.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<any> {
  try {
    const cookieToken = req.cookies?.accessToken || req.cookies?.access_token;
    const headerToken = req.headers.authorization?.replace(/^Bearer\s+/, "");
    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required. Please log in.",
        },
      });
    }

    const payload = verifyJwtToken(token, Env.JWT_SECRET);
    if (!payload?.userId) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Your session has expired. Please log in again.",
        },
      });
    }

    const user = await findUserById(payload.userId);
    if (!user) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User account no longer exists.",
        },
      });
    }

    // Check account lockout
    if (user.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: "ACCOUNT_LOCKED",
          message: "Account is temporarily locked due to failed login attempts. Please try again later.",
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired session.",
      },
    });
  }
}

/**
 * Middleware: optionalAuth
 * Attaches user to req.user if valid token exists; leaves req.user = null otherwise.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cookieToken = req.cookies?.accessToken || req.cookies?.access_token;
    const headerToken = req.headers.authorization?.replace(/^Bearer\s+/, "");
    const token = cookieToken || headerToken;

    if (token) {
      const payload = verifyJwtToken(token, Env.JWT_SECRET);
      if (payload?.userId) {
        const user = await findUserById(payload.userId);
        if (user && !(user.lockUntil && new Date(user.lockUntil).getTime() > Date.now())) {
          req.user = user;
        }
      }
    }
  } catch {
    // Proceed as unauthenticated guest
    req.user = undefined;
  }
  next();

}

/**
 * Middleware: requireCsrf
 * Mitigates CSRF for state-changing requests when session cookies are used.
 * Requires custom header: 'X-Requested-With: XMLHttpRequest' or 'X-TaxGenie-CSRF: 1'
 */
export function requireCsrf(req: Request, res: Response, next: NextFunction): any {
  const method = req.method.toUpperCase();
  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (!isStateChanging) {
    return next();
  }

  // If request uses cookies, enforce CSRF custom header
  const hasAuthCookie = Boolean(req.cookies?.accessToken || req.cookies?.refreshToken);
  if (hasAuthCookie) {
    const requestedWith = req.headers["x-requested-with"];
    const taxgenieCsrf = req.headers["x-taxgenie-csrf"];

    if (
      requestedWith !== "XMLHttpRequest" &&
      taxgenieCsrf !== "1" &&
      taxgenieCsrf !== "true"
    ) {
      return res.status(HTTPSTATUS.FORBIDDEN).json({
        success: false,
        error: {
          code: "CSRF_DETECTED",
          message: "Missing required custom header for state-changing request (CSRF protection).",
        },
      });
    }
  }

  next();
}

/**
 * Recursively check and sanitize against NoSQL injection
 * Rejects keys that begin with '$' or contain '.'
 */
function hasNoSqlInjection(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;

  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      return true;
    }
    if (typeof obj[key] === "object" && hasNoSqlInjection(obj[key])) {
      return true;
    }
  }

  return false;
}

export function sanitizeNoSql(req: Request, res: Response, next: NextFunction): any {
  if (
    hasNoSqlInjection(req.body) ||
    hasNoSqlInjection(req.query) ||
    hasNoSqlInjection(req.params)
  ) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Invalid characters detected in request payload (NoSQL injection prevention).",
      },
    });
  }
  next();
}
