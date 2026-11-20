import { Response } from "express";
import { Env } from "../config/env.config";

const IS_PROD = Env.NODE_ENV === "production";
const COOKIE_DOMAIN =
  process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN !== "localhost"
    ? process.env.COOKIE_DOMAIN
    : undefined;

export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  const cookieOpts = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax" as const,
    domain: COOKIE_DOMAIN,
    path: "/",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOpts,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });
  res.cookie("access_token", accessToken, {
    ...cookieOpts,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOpts,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
  res.cookie("refresh_token", refreshToken, {
    ...cookieOpts,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

export function clearAuthCookies(res: Response) {
  const cookieOpts = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax" as const,
    domain: COOKIE_DOMAIN,
    path: "/",
  };

  res.clearCookie("accessToken", cookieOpts);
  res.clearCookie("access_token", cookieOpts);
  res.clearCookie("refreshToken", cookieOpts);
  res.clearCookie("refresh_token", cookieOpts);
}
