import { NotFoundException, UnauthorizedException } from "../utils/app-error";
import {
  LoginSchemaType,
  RegisterSchemaType,
} from "../validators/auth.validator";
import { signJwtToken, refreshTokenSignOptions, verifyJwtToken } from "../utils/jwt";
import {
  createNewUser,
  findUserByEmail,
  findUserById,
} from "../utils/userStore";
import mongoose from "mongoose";
import ReportSettingModel from "../models/report-setting.model";
import { Env } from "../config/env.config";

export const registerService = async (body: RegisterSchemaType): Promise<any> => {
  const { email, name, password } = body;

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new UnauthorizedException("User already exists with this email");
  }

  const createdUser = await createNewUser({
    name,
    email,
    password,
  });

  return { user: createdUser };
};

export const loginService = async (body: LoginSchemaType): Promise<any> => {
  const { email, password } = body;
  const user = await findUserByEmail(email);
  if (!user) throw new NotFoundException("Email/password not found");

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid)
    throw new UnauthorizedException("Invalid email/password");

  const userId = user.id || user._id;
  const { token, expiresAt } = signJwtToken({ userId: String(userId) });
  const { token: refreshToken } = signJwtToken(
    { userId: String(userId) },
    refreshTokenSignOptions
  );

  let reportSetting = null;
  try {
    if (mongoose.connection.readyState === 1) {
      reportSetting = await ReportSettingModel.findOne(
        { userId },
        { _id: 1, frequency: 1, isEnabled: 1 }
      ).lean();
    }
  } catch (err) {
    console.warn("Could not query ReportSettingModel:", err);
  }

  if (!reportSetting) {
    reportSetting = {
      _id: "default_rep_1",
      userId: String(userId),
      frequency: "MONTHLY",
      isEnabled: true,
    };
  }

  return {
    user: typeof user.omitPassword === "function" ? user.omitPassword() : user,
    accessToken: token,
    refreshToken,
    expiresAt,
    reportSetting,
  };
};

export const refreshTokenService = async (
  tokenInput?: string,
  userIdFromAuth?: string
): Promise<any> => {
  let targetUserId = userIdFromAuth;

  if (tokenInput) {
    const payload = verifyJwtToken(tokenInput, Env.JWT_REFRESH_SECRET);
    if (payload?.userId) {
      targetUserId = payload.userId;
    }
  }

  if (!targetUserId) {
    throw new UnauthorizedException("Invalid, missing, or expired refresh token");
  }

  const user = await findUserById(targetUserId);
  if (!user) {
    throw new UnauthorizedException("User not found for token refresh");
  }

  const { token: newAccessToken, expiresAt } = signJwtToken({
    userId: String(targetUserId),
  });
  const { token: newRefreshToken } = signJwtToken(
    { userId: String(targetUserId) },
    refreshTokenSignOptions
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresAt,
    user: typeof user.omitPassword === "function" ? user.omitPassword() : user,
  };
};
