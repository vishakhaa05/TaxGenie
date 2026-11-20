import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import UserModel from "../models/user.model";
import ReportSettingModel, { ReportFrequencyEnum } from "../models/report-setting.model";
import { calulateNextReportDate } from "./helper";

export interface StoredUser {
  id: string;
  _id: string;
  name: string;
  email: string;
  password?: string;
  profilePicture?: string;
  createdAt: string;
  omitPassword: () => Omit<StoredUser, "password" | "omitPassword">;
  comparePassword?: (candidate: string) => Promise<boolean>;
}

const DATA_DIR = path.join(__dirname, "../../data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function readLocalUsers(): StoredUser[] {
  ensureDataFile();
  try {
    const content = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(content || "[]");
  } catch {
    return [];
  }
}

function writeLocalUsers(users: StoredUser[]) {
  ensureDataFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export async function findUserByEmail(email: string): Promise<any | null> {
  const normalizedEmail = email.toLowerCase().trim();

  if (mongoose.connection.readyState === 1) {
    try {
      const user = await (UserModel as any).findOne({ email: normalizedEmail });
      if (user) return user;
    } catch (e) {
      console.warn("MongoDB find failed, checking local store:", e);
    }
  }

  const users = readLocalUsers();
  const localUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!localUser) return null;

  return {
    ...localUser,
    id: localUser.id,
    _id: localUser.id,
    comparePassword: async (candidate: string) => {
      return bcrypt.compare(candidate, localUser.password || "");
    },
    omitPassword: () => {
      const { password, ...rest } = localUser;
      return rest;
    },
  };
}

export async function findUserById(id: string): Promise<any | null> {
  if (mongoose.connection.readyState === 1) {
    try {
      const user = await (UserModel as any).findById(id);
      if (user) return user;
    } catch (e) {
      console.warn("MongoDB findById failed, checking local store:", e);
    }
  }


  const users = readLocalUsers();
  const localUser = users.find((u) => u.id === id || u._id === id);
  if (!localUser) return null;

  return {
    ...localUser,
    id: localUser.id,
    _id: localUser.id,
    comparePassword: async (candidate: string) => {
      return bcrypt.compare(candidate, localUser.password || "");
    },
    omitPassword: () => {
      const { password, ...rest } = localUser;
      return rest;
    },
  };
}

export async function createNewUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<any> {
  const normalizedEmail = data.email.toLowerCase().trim();

  // Try Mongo first if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const newUser = new UserModel({
        name: data.name,
        email: normalizedEmail,
        password: data.password,
      });
      await newUser.save();

      try {
        const reportSetting = new ReportSettingModel({
          userId: newUser._id,
          frequency: ReportFrequencyEnum.MONTHLY,
          isEnabled: true,
          nextReportDate: calulateNextReportDate(),
          lastSentDate: null,
        });
        await reportSetting.save();
      } catch (err) {
        console.warn("Could not create report settings:", err);
      }

      return newUser.omitPassword();
    } catch (e) {
      console.warn("MongoDB create failed, saving to local store:", e);
    }
  }

  // Fallback to local store with bcrypt hashing
  const users = readLocalUsers();
  const existing = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newUserRecord: StoredUser = {
    id: newId,
    _id: newId,
    name: data.name,
    email: normalizedEmail,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    omitPassword() {
      const { password, ...rest } = this;
      return rest;
    },
  };

  users.push(newUserRecord);
  writeLocalUsers(users);

  return newUserRecord.omitPassword();
}

export async function updateUserRecord(
  id: string,
  update: { name?: string | undefined; profilePicture?: string | undefined }
): Promise<any> {
  if (mongoose.connection.readyState === 1) {
    try {
      const user = await (UserModel as any).findById(id);

      if (user) {
        if (update.name) user.name = update.name;
        if (update.profilePicture) user.profilePicture = update.profilePicture;
        await user.save();
        return user;
      }
    } catch (e) {
      console.warn("MongoDB updateUser failed, checking local store:", e);
    }
  }

  const users = readLocalUsers();
  const index = users.findIndex((u) => u.id === id || u._id === id);
  if (index === -1) return null;

  const targetUser = users[index];
  if (!targetUser) return null;

  if (update.name) targetUser.name = update.name;
  if (update.profilePicture) targetUser.profilePicture = update.profilePicture;

  writeLocalUsers(users);
  return {
    ...targetUser,
    id: targetUser.id,
    _id: targetUser.id,
    omitPassword: () => {
      const { password, ...rest } = targetUser;
      return rest;
    },
  };
}
