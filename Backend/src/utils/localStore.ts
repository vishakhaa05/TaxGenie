import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import UserModel, { UserDocument } from "../models/user.model";
import OtpModel, { OtpDocument } from "../models/otp.model";
import RefreshTokenModel, { RefreshTokenDocument } from "../models/refresh-token.model";
import PasswordResetModel, { PasswordResetDocument } from "../models/password-reset.model";
import CalculationModel, { CalculationDocument, CalculationType } from "../models/calculation.model";
import BusinessProfileModel, { BusinessProfileDocument } from "../models/business-profile.model";
import CustomerModel, { CustomerDocument } from "../models/customer.model";
import CounterModel, { CounterDocument } from "../models/counter.model";
import InvoiceModel, { InvoiceDocument } from "../models/invoice.model";

const DATA_DIR = path.join(__dirname, "../../data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const OTPS_FILE = path.join(DATA_DIR, "otps.json");
const TOKENS_FILE = path.join(DATA_DIR, "tokens.json");
const RESETS_FILE = path.join(DATA_DIR, "resets.json");
const CALCS_FILE = path.join(DATA_DIR, "calculations.json");
const PROFILES_FILE = path.join(DATA_DIR, "profiles.json");
const CUSTOMERS_FILE = path.join(DATA_DIR, "customers.json");
const COUNTERS_FILE = path.join(DATA_DIR, "counters.json");
const INVOICES_FILE = path.join(DATA_DIR, "invoices.json");

function ensureFile(filePath: string, defaultContent: any = []) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), "utf-8");
  }
}

function readJson<T>(filePath: string): T[] {
  ensureFile(filePath, []);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function writeJson<T>(filePath: string, data: T[]) {
  ensureFile(filePath, []);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export function resetLocalStoreForTesting() {
  writeJson(USERS_FILE, []);
  writeJson(OTPS_FILE, []);
  writeJson(TOKENS_FILE, []);
  writeJson(RESETS_FILE, []);
  writeJson(CALCS_FILE, []);
  writeJson(PROFILES_FILE, []);
  writeJson(CUSTOMERS_FILE, []);
  writeJson(COUNTERS_FILE, []);
  writeJson(INVOICES_FILE, []);
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

// -----------------------------------------------------------------------------
// USER STORE
// -----------------------------------------------------------------------------
export async function findUserByEmail(email: string): Promise<any | null> {
  const normalized = email.toLowerCase().trim();
  if (isMongoConnected()) {
    try {
      const user = await (UserModel as any).findOne({ email: normalized });
      if (user) return user;
    } catch (e) {
      console.warn("MongoDB findUserByEmail fallback:", e);
    }
  }

  const users = readJson<any>(USERS_FILE);
  const found = users.find((u) => u.email.toLowerCase().trim() === normalized);
  if (!found) return null;

  return wrapLocalUser(found);
}

export async function findUserById(id: string): Promise<any | null> {
  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const user = await (UserModel as any).findById(id);
        if (user) return user;
      }
    } catch (e) {
      console.warn("MongoDB findUserById fallback:", e);
    }
  }


  const users = readJson<any>(USERS_FILE);
  const found = users.find((u) => (u._id || u.id) === id);
  if (!found) return null;

  return wrapLocalUser(found);
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  isEmailVerified?: boolean;
  language?: "en" | "hi";
  theme?: "light" | "dark" | "system";
  defaultState?: string;
  ageGroup?: "general" | "senior" | "superSenior";
}): Promise<any> {
  const normalized = data.email.toLowerCase().trim();

  if (isMongoConnected()) {
    try {
      const user = new UserModel({
        name: data.name,
        email: normalized,
        password: data.passwordHash,
        isEmailVerified: data.isEmailVerified || false,
        language: data.language || "en",
        theme: data.theme || "system",
        defaultState: data.defaultState || "27",
        ageGroup: data.ageGroup || "general",
      });
      await user.save();
      return user;
    } catch (e) {
      console.warn("MongoDB createUser fallback:", e);
    }
  }

  const users = readJson<any>(USERS_FILE);
  const id = new mongoose.Types.ObjectId().toString();
  const newUser = {
    _id: id,
    id,
    name: data.name,
    email: normalized,
    password: data.passwordHash,
    isEmailVerified: data.isEmailVerified || false,
    language: data.language || "en",
    theme: data.theme || "system",
    defaultState: data.defaultState || "27",
    ageGroup: data.ageGroup || "general",
    failedLoginCount: 0,
    lockUntil: null,
    profilePicture: null,
    mode: "PERSONAL",
    riskAppetite: "MODERATE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeJson(USERS_FILE, users);

  return wrapLocalUser(newUser);
}

export async function updateUser(id: string, updates: Record<string, any>): Promise<any | null> {
  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const user = await (UserModel as any).findByIdAndUpdate(id, { $set: updates }, { new: true });
        if (user) return user;
      }
    } catch (e) {
      console.warn("MongoDB updateUser fallback:", e);
    }
  }

  const users = readJson<any>(USERS_FILE);
  const idx = users.findIndex((u) => (u._id || u.id) === id);
  if (idx === -1) return null;

  users[idx] = {
    ...users[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  writeJson(USERS_FILE, users);
  return wrapLocalUser(users[idx]);
}

export async function deleteUserAndAllData(id: string): Promise<boolean> {
  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const user = await (UserModel as any).findById(id);
        const email = user?.email;
        await (UserModel as any).findByIdAndDelete(id);
        await (RefreshTokenModel as any).deleteMany({ userId: id });
        await (CalculationModel as any).deleteMany({ userId: id });
        await (BusinessProfileModel as any).deleteMany({ userId: id });
        await (CustomerModel as any).deleteMany({ userId: id });
        await (CounterModel as any).deleteMany({ userId: id });
        await (InvoiceModel as any).deleteMany({ userId: id });
        if (email) {
          await (OtpModel as any).deleteMany({ email });
          await (PasswordResetModel as any).deleteMany({ email });
        }
      }
    } catch (e) {
      console.warn("MongoDB deleteUserAndAllData error:", e);
    }
  }


  // Local store cleanup
  let users = readJson<any>(USERS_FILE);
  const target = users.find((u) => (u._id || u.id) === id);
  const email = target?.email?.toLowerCase().trim();
  users = users.filter((u) => (u._id || u.id) !== id);
  writeJson(USERS_FILE, users);

  let tokens = readJson<any>(TOKENS_FILE);
  tokens = tokens.filter((t) => t.userId !== id);
  writeJson(TOKENS_FILE, tokens);

  let calcs = readJson<any>(CALCS_FILE);
  calcs = calcs.filter((c) => c.userId !== id);
  writeJson(CALCS_FILE, calcs);

  let profiles = readJson<any>(PROFILES_FILE);
  profiles = profiles.filter((p) => p.userId !== id);
  writeJson(PROFILES_FILE, profiles);

  let customers = readJson<any>(CUSTOMERS_FILE);
  customers = customers.filter((c) => c.userId !== id);
  writeJson(CUSTOMERS_FILE, customers);

  let counters = readJson<any>(COUNTERS_FILE);
  counters = counters.filter((c) => c.userId !== id);
  writeJson(COUNTERS_FILE, counters);

  let invoices = readJson<any>(INVOICES_FILE);
  invoices = invoices.filter((inv) => inv.userId !== id);
  writeJson(INVOICES_FILE, invoices);

  if (email) {
    let otps = readJson<any>(OTPS_FILE);
    otps = otps.filter((o) => o.email !== email);
    writeJson(OTPS_FILE, otps);

    let resets = readJson<any>(RESETS_FILE);
    resets = resets.filter((r) => r.email !== email);
    writeJson(RESETS_FILE, resets);
  }

  return true;
}

function wrapLocalUser(raw: any) {
  return {
    ...raw,
    _id: raw._id || raw.id,
    id: raw._id || raw.id,
    omitPassword() {
      const copy = { ...raw };
      delete copy.password;
      return copy;
    },
    async save() {
      return updateUser(this._id || this.id, this);
    },
  };
}

// -----------------------------------------------------------------------------
// OTP STORE
// -----------------------------------------------------------------------------
export async function saveOtp(data: {
  userId?: string;
  email: string;
  purpose: "verify_email" | "reset_password";
  codeHash: string;
  expiresAt: Date;
}): Promise<any> {
  const email = data.email.toLowerCase().trim();

  if (isMongoConnected()) {
    try {
      await (OtpModel as any).deleteMany({ email, purpose: data.purpose });
      const otp = new OtpModel({
        userId: data.userId ? new mongoose.Types.ObjectId(data.userId) : undefined,
        email,
        purpose: data.purpose,
        codeHash: data.codeHash,
        expiresAt: data.expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
        sendCountWindow: 1,
        windowStartTime: new Date(),
      });
      await otp.save();
      return otp;
    } catch (e) {
      console.warn("MongoDB saveOtp fallback:", e);
    }
  }

  let otps = readJson<any>(OTPS_FILE);
  otps = otps.filter((o) => !(o.email === email && o.purpose === data.purpose));

  const newOtp = {
    _id: new mongoose.Types.ObjectId().toString(),
    userId: data.userId,
    email,
    purpose: data.purpose,
    codeHash: data.codeHash,
    expiresAt: data.expiresAt.toISOString(),
    attempts: 0,
    lastSentAt: new Date().toISOString(),
    sendCountWindow: 1,
    windowStartTime: new Date().toISOString(),
  };

  otps.push(newOtp);
  writeJson(OTPS_FILE, otps);
  return newOtp;
}

export async function findLatestOtp(email: string, purpose: string = "verify_email"): Promise<any | null> {
  const normEmail = email.toLowerCase().trim();

  if (isMongoConnected()) {
    try {
      const otp = await (OtpModel as any).findOne({ email: normEmail, purpose }).sort({ createdAt: -1 });
      if (otp) return otp;
    } catch (e) {
      console.warn("MongoDB findLatestOtp fallback:", e);
    }
  }

  const otps = readJson<any>(OTPS_FILE);
  const found = otps
    .filter((o) => o.email === normEmail && o.purpose === purpose)
    .sort((a, b) => new Date(b.lastSentAt).getTime() - new Date(a.lastSentAt).getTime())[0];

  return found || null;
}

export async function updateOtpAttempts(id: string, attempts: number): Promise<void> {
  if (isMongoConnected()) {
    try {
      await (OtpModel as any).findByIdAndUpdate(id, { $set: { attempts } });
      return;
    } catch (e) {
      console.warn("MongoDB updateOtpAttempts fallback:", e);
    }
  }

  const otps = readJson<any>(OTPS_FILE);
  const target = otps.find((o) => o._id === id);
  if (target) {
    target.attempts = attempts;
    writeJson(OTPS_FILE, otps);
  }
}

export async function deleteOtp(id: string): Promise<void> {
  if (isMongoConnected()) {
    try {
      await (OtpModel as any).findByIdAndDelete(id);
      return;
    } catch (e) {
      console.warn("MongoDB deleteOtp fallback:", e);
    }
  }


  let otps = readJson<any>(OTPS_FILE);
  otps = otps.filter((o) => o._id !== id);
  writeJson(OTPS_FILE, otps);
}

// -----------------------------------------------------------------------------
// REFRESH TOKEN / SESSION STORE
// -----------------------------------------------------------------------------
export async function saveRefreshToken(data: {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  userAgent?: string | undefined;
  ip?: string | undefined;
}): Promise<any> {

  if (isMongoConnected()) {
    try {
      const record = new RefreshTokenModel({
        userId: new mongoose.Types.ObjectId(data.userId),
        tokenHash: data.tokenHash,
        familyId: data.familyId,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent || "",
        ip: data.ip || "",
      });
      await record.save();
      return record;
    } catch (e) {
      console.warn("MongoDB saveRefreshToken fallback:", e);
    }
  }

  const tokens = readJson<any>(TOKENS_FILE);
  const record = {
    _id: new mongoose.Types.ObjectId().toString(),
    userId: data.userId,
    tokenHash: data.tokenHash,
    familyId: data.familyId,
    expiresAt: data.expiresAt.toISOString(),
    revokedAt: null,
    userAgent: data.userAgent || "",
    ip: data.ip || "",
    createdAt: new Date().toISOString(),
  };

  tokens.push(record);
  writeJson(TOKENS_FILE, tokens);
  return record;
}

export async function findRefreshTokenByHash(tokenHash: string): Promise<any | null> {
  if (isMongoConnected()) {
    try {
      const record = await (RefreshTokenModel as any).findOne({ tokenHash });
      if (record) return record;
    } catch (e) {
      console.warn("MongoDB findRefreshTokenByHash fallback:", e);
    }
  }

  const tokens = readJson<any>(TOKENS_FILE);
  return tokens.find((t) => t.tokenHash === tokenHash) || null;
}

export async function revokeToken(tokenHash: string): Promise<void> {
  if (isMongoConnected()) {
    try {
      await (RefreshTokenModel as any).findOneAndUpdate({ tokenHash }, { $set: { revokedAt: new Date() } });
      return;
    } catch (e) {
      console.warn("MongoDB revokeToken fallback:", e);
    }
  }

  const tokens = readJson<any>(TOKENS_FILE);
  const target = tokens.find((t) => t.tokenHash === tokenHash);
  if (target) {
    target.revokedAt = new Date().toISOString();
    writeJson(TOKENS_FILE, tokens);
  }
}

export async function revokeFamily(familyId: string): Promise<void> {
  if (isMongoConnected()) {
    try {
      await (RefreshTokenModel as any).updateMany({ familyId }, { $set: { revokedAt: new Date() } });
      return;
    } catch (e) {
      console.warn("MongoDB revokeFamily fallback:", e);
    }
  }

  const tokens = readJson<any>(TOKENS_FILE);
  tokens.forEach((t) => {
    if (t.familyId === familyId) {
      t.revokedAt = new Date().toISOString();
    }
  });
  writeJson(TOKENS_FILE, tokens);
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  if (isMongoConnected()) {
    try {
      await (RefreshTokenModel as any).updateMany({ userId }, { $set: { revokedAt: new Date() } });
      return;
    } catch (e) {
      console.warn("MongoDB revokeAllUserSessions fallback:", e);
    }
  }

  const tokens = readJson<any>(TOKENS_FILE);
  tokens.forEach((t) => {
    if (t.userId === userId) {
      t.revokedAt = new Date().toISOString();
    }
  });
  writeJson(TOKENS_FILE, tokens);
}

// -----------------------------------------------------------------------------
// PASSWORD RESET STORE
// -----------------------------------------------------------------------------
export async function savePasswordReset(data: {
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<any> {
  if (isMongoConnected()) {
    try {
      await (PasswordResetModel as any).deleteMany({ email: data.email });
      const record = new PasswordResetModel({
        userId: new mongoose.Types.ObjectId(data.userId),
        email: data.email.toLowerCase().trim(),
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      });
      await record.save();
      return record;
    } catch (e) {
      console.warn("MongoDB savePasswordReset fallback:", e);
    }
  }

  let resets = readJson<any>(RESETS_FILE);
  resets = resets.filter((r) => r.email !== data.email.toLowerCase().trim());

  const newReset = {
    _id: new mongoose.Types.ObjectId().toString(),
    userId: data.userId,
    email: data.email.toLowerCase().trim(),
    tokenHash: data.tokenHash,
    expiresAt: data.expiresAt.toISOString(),
    usedAt: null,
    createdAt: new Date().toISOString(),
  };

  resets.push(newReset);
  writeJson(RESETS_FILE, resets);
  return newReset;
}

export async function findPasswordResetByHash(tokenHash: string): Promise<any | null> {
  if (isMongoConnected()) {
    try {
      const record = await (PasswordResetModel as any).findOne({ tokenHash, usedAt: null });
      if (record) return record;
    } catch (e) {
      console.warn("MongoDB findPasswordResetByHash fallback:", e);
    }
  }

  const resets = readJson<any>(RESETS_FILE);
  return resets.find((r) => r.tokenHash === tokenHash && !r.usedAt) || null;
}

export async function markPasswordResetUsed(id: string): Promise<void> {
  if (isMongoConnected()) {
    try {
      await (PasswordResetModel as any).findByIdAndUpdate(id, { $set: { usedAt: new Date() } });
      return;
    } catch (e) {
      console.warn("MongoDB markPasswordResetUsed fallback:", e);
    }
  }


  const resets = readJson<any>(RESETS_FILE);
  const target = resets.find((r) => r._id === id);
  if (target) {
    target.usedAt = new Date().toISOString();
    writeJson(RESETS_FILE, resets);
  }
}

// -----------------------------------------------------------------------------
// CALCULATION STORE
// -----------------------------------------------------------------------------
export async function countUserCalculations(userId: string): Promise<number> {
  if (isMongoConnected()) {
    try {
      return await CalculationModel.countDocuments({ userId });
    } catch (e) {
      console.warn("MongoDB countUserCalculations fallback:", e);
    }
  }

  const calcs = readJson<any>(CALCS_FILE);
  return calcs.filter((c) => c.userId === userId).length;
}

export async function saveCalculation(data: {
  userId: string;
  type: CalculationType;
  taxYear: string;
  name: string;
  inputs: Record<string, any>;
  result: Record<string, any>;
  rulesVersion?: string;
  summary: Record<string, any>;
}): Promise<any> {
  if (isMongoConnected()) {
    try {
      const calc = new CalculationModel({
        userId: new mongoose.Types.ObjectId(data.userId),
        type: data.type,
        taxYear: data.taxYear,
        name: data.name,
        inputs: data.inputs,
        result: data.result,
        rulesVersion: data.rulesVersion || "2026-27-v1",
        summary: data.summary,
      });
      await calc.save();
      return calc;
    } catch (e) {
      console.warn("MongoDB saveCalculation fallback:", e);
    }
  }

  const calcs = readJson<any>(CALCS_FILE);
  const idStr = new mongoose.Types.ObjectId().toString();
  const newCalc = {
    _id: idStr,
    id: idStr,
    userId: String(data.userId),
    type: data.type,
    taxYear: data.taxYear,
    name: data.name,
    inputs: data.inputs,
    result: data.result,
    rulesVersion: data.rulesVersion || "2026-27-v1",
    summary: data.summary,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  calcs.unshift(newCalc);
  writeJson(CALCS_FILE, calcs);
  return newCalc;
}

export async function listUserCalculations(
  userId: string,
  options: {
    type?: string | undefined;
    taxYear?: string | undefined;
    q?: string | undefined;
    sort?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  } = {}
): Promise<{ calculations: any[]; total: number; page: number; totalPages: number }> {

  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));

  if (isMongoConnected()) {
    try {
      const query: any = { userId };
      if (options.type && ["income_tax", "gst"].includes(options.type)) {
        query.type = options.type;
      }
      if (options.taxYear) {
        query.taxYear = options.taxYear;
      }
      if (options.q) {
        query.name = { $regex: options.q, $options: "i" };
      }

      let sortOptions: any = { createdAt: -1 };
      if (options.sort === "oldest") sortOptions = { createdAt: 1 };
      if (options.sort === "amount_desc") sortOptions = { "summary.grossIncome": -1, "summary.amount": -1 };
      if (options.sort === "amount_asc") sortOptions = { "summary.grossIncome": 1, "summary.amount": 1 };

      const total = await (CalculationModel as any).countDocuments(query);
      const calculations = await (CalculationModel as any).find(query)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return {
        calculations,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (e) {
      console.warn("MongoDB listUserCalculations fallback:", e);
    }
  }

  let calcs = readJson<any>(CALCS_FILE).filter((c) => c.userId === userId);

  if (options.type && ["income_tax", "gst"].includes(options.type)) {
    calcs = calcs.filter((c) => c.type === options.type);
  }
  if (options.taxYear) {
    calcs = calcs.filter((c) => c.taxYear === options.taxYear);
  }
  if (options.q) {
    const term = options.q.toLowerCase().trim();
    calcs = calcs.filter((c) => c.name.toLowerCase().includes(term));
  }

  if (options.sort === "oldest") {
    calcs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else {
    calcs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const total = calcs.length;
  const paginated = calcs.slice((page - 1) * limit, page * limit);

  return {
    calculations: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function findCalculationByIdAndUser(id: string, userId: string): Promise<any | null> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const found = await (CalculationModel as any).findOne({ _id: id, userId: userObjId });
        if (found) return found;
      }
    } catch (e) {
      console.warn("MongoDB findCalculationByIdAndUser fallback:", e);
    }
  }

  const calcs = readJson<any>(CALCS_FILE);
  return (
    calcs.find(
      (c) =>
        (String(c._id) === String(id) || String(c.id) === String(id)) &&
        String(c.userId) === String(userId)
    ) || null
  );
}

export async function updateCalculationName(id: string, userId: string, name: string): Promise<any | null> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const found = await (CalculationModel as any).findOneAndUpdate(
          { _id: id, userId: userObjId },
          { $set: { name: name.trim() } },
          { new: true }
        );
        if (found) return found;
      }
    } catch (e) {
      console.warn("MongoDB updateCalculationName fallback:", e);
    }
  }

  const calcs = readJson<any>(CALCS_FILE);
  const target = calcs.find(
    (c) =>
      (String(c._id) === String(id) || String(c.id) === String(id)) &&
      String(c.userId) === String(userId)
  );
  if (!target) return null;

  target.name = name.trim();
  target.updatedAt = new Date().toISOString();
  writeJson(CALCS_FILE, calcs);
  return target;
}

export async function deleteCalculationByIdAndUser(id: string, userId: string): Promise<boolean> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const result = await (CalculationModel as any).findOneAndDelete({ _id: id, userId: userObjId });
        if (result) return true;
      }
    } catch (e) {
      console.warn("MongoDB deleteCalculationByIdAndUser fallback:", e);
    }
  }


  let calcs = readJson<any>(CALCS_FILE);
  const initialLength = calcs.length;
  calcs = calcs.filter(
    (c) =>
      !(
        (String(c._id) === String(id) || String(c.id) === String(id)) &&
        String(c.userId) === String(userId)
      )
  );
  writeJson(CALCS_FILE, calcs);

  return calcs.length < initialLength;
}

// -----------------------------------------------------------------------------
// BUSINESS PROFILE STORE
// -----------------------------------------------------------------------------
export async function findBusinessProfileByUserId(userId: string): Promise<any | null> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      const found = await (BusinessProfileModel as any).findOne({ userId: userObjId }).lean();
      if (found) return found;
    } catch (e) {
      console.warn("MongoDB findBusinessProfileByUserId fallback:", e);
    }
  }

  const profiles = readJson<any>(PROFILES_FILE);
  return profiles.find((p) => String(p.userId) === String(userId)) || null;
}

export async function upsertBusinessProfile(userId: string, data: any): Promise<any> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      const updated = await (BusinessProfileModel as any).findOneAndUpdate(
        { userId: userObjId },
        { $set: { ...data, userId: userObjId } },
        { upsert: true, new: true, runValidators: true }
      ).lean();
      if (updated) return updated;
    } catch (e) {
      console.warn("MongoDB upsertBusinessProfile fallback:", e);
    }
  }

  const profiles = readJson<any>(PROFILES_FILE);
  const idx = profiles.findIndex((p) => String(p.userId) === String(userId));
  const now = new Date().toISOString();

  if (idx !== -1) {
    profiles[idx] = {
      ...profiles[idx],
      ...data,
      userId: String(userId),
      updatedAt: now,
    };
    writeJson(PROFILES_FILE, profiles);
    return profiles[idx];
  } else {
    const idStr = new mongoose.Types.ObjectId().toString();
    const newProfile = {
      _id: idStr,
      id: idStr,
      ...data,
      userId: String(userId),
      createdAt: now,
      updatedAt: now,
    };
    profiles.push(newProfile);
    writeJson(PROFILES_FILE, profiles);
    return newProfile;
  }
}

// -----------------------------------------------------------------------------
// CUSTOMER STORE
// -----------------------------------------------------------------------------
export async function countUserCustomers(userId: string): Promise<number> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      return await (CustomerModel as any).countDocuments({ userId: userObjId });
    } catch (e) {
      console.warn("MongoDB countUserCustomers fallback:", e);
    }
  }

  const customers = readJson<any>(CUSTOMERS_FILE);
  return customers.filter((c) => String(c.userId) === String(userId)).length;
}

export async function createCustomer(userId: string, data: any): Promise<any> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      const customer = new CustomerModel({
        ...data,
        userId: userObjId,
      });
      await customer.save();
      return customer.toObject();
    } catch (e) {
      console.warn("MongoDB createCustomer fallback:", e);
    }
  }

  const customers = readJson<any>(CUSTOMERS_FILE);
  const idStr = new mongoose.Types.ObjectId().toString();
  const now = new Date().toISOString();
  const newCustomer = {
    _id: idStr,
    id: idStr,
    ...data,
    userId: String(userId),
    createdAt: now,
    updatedAt: now,
  };
  customers.push(newCustomer);
  writeJson(CUSTOMERS_FILE, customers);
  return newCustomer;
}

export async function listUserCustomers(userId: string, q?: string): Promise<any[]> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      const query: any = { userId: userObjId };
      if (q && q.trim()) {
        query.name = { $regex: q.trim(), $options: "i" };
      }
      return await (CustomerModel as any).find(query).sort({ name: 1 }).lean();
    } catch (e) {
      console.warn("MongoDB listUserCustomers fallback:", e);
    }
  }

  let customers = readJson<any>(CUSTOMERS_FILE).filter((c) => String(c.userId) === String(userId));
  if (q && q.trim()) {
    const term = q.trim().toLowerCase();
    customers = customers.filter((c) => c.name?.toLowerCase().includes(term));
  }
  customers.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return customers;
}

export async function findCustomerByIdAndUser(id: string, userId: string): Promise<any | null> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const found = await (CustomerModel as any).findOne({ _id: id, userId: userObjId }).lean();
        if (found) return found;
      }
    } catch (e) {
      console.warn("MongoDB findCustomerByIdAndUser fallback:", e);
    }
  }

  const customers = readJson<any>(CUSTOMERS_FILE);
  return (
    customers.find(
      (c) =>
        (String(c._id) === String(id) || String(c.id) === String(id)) &&
        String(c.userId) === String(userId)
    ) || null
  );
}

export async function updateCustomerByIdAndUser(id: string, userId: string, data: any): Promise<any | null> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const updated = await (CustomerModel as any).findOneAndUpdate(
          { _id: id, userId: userObjId },
          { $set: data },
          { new: true, runValidators: true }
        ).lean();
        if (updated) return updated;
      }
    } catch (e) {
      console.warn("MongoDB updateCustomerByIdAndUser fallback:", e);
    }
  }

  const customers = readJson<any>(CUSTOMERS_FILE);
  const idx = customers.findIndex(
    (c) =>
      (String(c._id) === String(id) || String(c.id) === String(id)) &&
      String(c.userId) === String(userId)
  );
  if (idx === -1) return null;

  customers[idx] = {
    ...customers[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeJson(CUSTOMERS_FILE, customers);
  return customers[idx];
}

export async function deleteCustomerByIdAndUser(id: string, userId: string): Promise<boolean> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const deleted = await (CustomerModel as any).findOneAndDelete({ _id: id, userId: userObjId });
        if (deleted) return true;
      }
    } catch (e) {
      console.warn("MongoDB deleteCustomerByIdAndUser fallback:", e);
    }
  }

  let customers = readJson<any>(CUSTOMERS_FILE);
  const initialLength = customers.length;
  customers = customers.filter(
    (c) =>
      !(
        (String(c._id) === String(id) || String(c.id) === String(id)) &&
        String(c.userId) === String(userId)
      )
  );
  writeJson(CUSTOMERS_FILE, customers);
  return customers.length < initialLength;
}

// -----------------------------------------------------------------------------
// COUNTER STORE (ATOMIC NUMBERING)
// -----------------------------------------------------------------------------
export async function getNextInvoiceNumber(userId: string, key: string): Promise<number> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      const counter = await (CounterModel as any).findOneAndUpdate(
        { userId: userObjId, key },
        { $inc: { nextNumber: 1 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      if (counter) {
        // Since findOneAndUpdate with $inc returns the value AFTER increment,
        // if nextNumber is initially 1, after $inc: 1 it becomes 2.
        // Wait, to get 1, 2, 3...:
        // If we want nextNumber to return 1 first, we can return counter.nextNumber - 1 or initialize at 0.
        // Let's ensure sequence starts at 1!
        return counter.nextNumber;
      }
    } catch (e) {
      console.warn("MongoDB getNextInvoiceNumber fallback:", e);
    }
  }

  const counters = readJson<any>(COUNTERS_FILE);
  const target = counters.find((c) => String(c.userId) === String(userId) && c.key === key);
  if (!target) {
    const newCounter = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId: String(userId),
      key,
      nextNumber: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    counters.push(newCounter);
    writeJson(COUNTERS_FILE, counters);
    return 1;
  } else {
    target.nextNumber += 1;
    target.updatedAt = new Date().toISOString();
    writeJson(COUNTERS_FILE, counters);
    return target.nextNumber;
  }
}

// -----------------------------------------------------------------------------
// INVOICE STORE
// -----------------------------------------------------------------------------
export async function countUserInvoices(userId: string): Promise<number> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      return await (InvoiceModel as any).countDocuments({ userId: userObjId });
    } catch (e) {
      console.warn("MongoDB countUserInvoices fallback:", e);
    }
  }

  const invoices = readJson<any>(INVOICES_FILE);
  return invoices.filter((inv) => String(inv.userId) === String(userId)).length;
}

export async function createInvoice(data: any): Promise<any> {
  const userObjId = mongoose.Types.ObjectId.isValid(data.userId) ? new mongoose.Types.ObjectId(data.userId) : data.userId;
  if (isMongoConnected()) {
    try {
      const invoice = new InvoiceModel({
        ...data,
        userId: userObjId,
      });
      await invoice.save();
      return invoice.toObject();
    } catch (e) {
      console.warn("MongoDB createInvoice fallback:", e);
    }
  }

  const invoices = readJson<any>(INVOICES_FILE);
  const idStr = new mongoose.Types.ObjectId().toString();
  const now = new Date().toISOString();
  const newInvoice = {
    _id: idStr,
    id: idStr,
    ...data,
    userId: String(data.userId),
    createdAt: now,
    updatedAt: now,
  };
  invoices.unshift(newInvoice);
  writeJson(INVOICES_FILE, invoices);
  return newInvoice;
}

export async function findInvoiceByIdAndUser(id: string, userId: string): Promise<any | null> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const found = await (InvoiceModel as any).findOne({ _id: id, userId: userObjId }).lean();
        if (found) return found;
      }
    } catch (e) {
      console.warn("MongoDB findInvoiceByIdAndUser fallback:", e);
    }
  }

  const invoices = readJson<any>(INVOICES_FILE);
  return (
    invoices.find(
      (inv) =>
        (String(inv._id) === String(id) || String(inv.id) === String(id)) &&
        String(inv.userId) === String(userId)
    ) || null
  );
}

export async function updateInvoiceDraftByIdAndUser(id: string, userId: string, data: any): Promise<any | null> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const updated = await (InvoiceModel as any).findOneAndUpdate(
          { _id: id, userId: userObjId, status: "draft" },
          { $set: data },
          { new: true, runValidators: true }
        ).lean();
        if (updated) return updated;
      }
    } catch (e) {
      console.warn("MongoDB updateInvoiceDraftByIdAndUser fallback:", e);
    }
  }

  const invoices = readJson<any>(INVOICES_FILE);
  const idx = invoices.findIndex(
    (inv) =>
      (String(inv._id) === String(id) || String(inv.id) === String(id)) &&
      String(inv.userId) === String(userId) &&
      inv.status === "draft"
  );
  if (idx === -1) return null;

  invoices[idx] = {
    ...invoices[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeJson(INVOICES_FILE, invoices);
  return invoices[idx];
}

export async function deleteInvoiceDraftByIdAndUser(id: string, userId: string): Promise<boolean> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const deleted = await (InvoiceModel as any).findOneAndDelete({
          _id: id,
          userId: userObjId,
          status: "draft",
        });
        if (deleted) return true;
      }
    } catch (e) {
      console.warn("MongoDB deleteInvoiceDraftByIdAndUser fallback:", e);
    }
  }

  let invoices = readJson<any>(INVOICES_FILE);
  const initialLength = invoices.length;
  invoices = invoices.filter(
    (inv) =>
      !(
        (String(inv._id) === String(id) || String(inv.id) === String(id)) &&
        String(inv.userId) === String(userId) &&
        inv.status === "draft"
      )
  );
  writeJson(INVOICES_FILE, invoices);
  return invoices.length < initialLength;
}

export async function issueInvoiceByIdAndUser(id: string, userId: string, updateData: any): Promise<any | null> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const updated = await (InvoiceModel as any).findOneAndUpdate(
          { _id: id, userId: userObjId, status: "draft" },
          { $set: { ...updateData, status: "issued" } },
          { new: true }
        ).lean();
        if (updated) return updated;
      }
    } catch (e) {
      console.warn("MongoDB issueInvoiceByIdAndUser fallback:", e);
    }
  }

  const invoices = readJson<any>(INVOICES_FILE);
  const idx = invoices.findIndex(
    (inv) =>
      (String(inv._id) === String(id) || String(inv.id) === String(id)) &&
      String(inv.userId) === String(userId) &&
      inv.status === "draft"
  );
  if (idx === -1) return null;

  invoices[idx] = {
    ...invoices[idx],
    ...updateData,
    status: "issued",
    updatedAt: new Date().toISOString(),
  };
  writeJson(INVOICES_FILE, invoices);
  return invoices[idx];
}

export async function updateInvoiceStatusByIdAndUser(
  id: string,
  userId: string,
  status: "draft" | "issued" | "paid" | "cancelled",
  timestampField?: string
): Promise<any | null> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  const updates: any = { status };
  if (timestampField) {
    updates[timestampField] = status === "issued" ? null : new Date();
  }

  if (isMongoConnected()) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const updated = await (InvoiceModel as any).findOneAndUpdate(
          { _id: id, userId: userObjId },
          { $set: updates },
          { new: true }
        ).lean();
        if (updated) return updated;
      }
    } catch (e) {
      console.warn("MongoDB updateInvoiceStatusByIdAndUser fallback:", e);
    }
  }

  const invoices = readJson<any>(INVOICES_FILE);
  const idx = invoices.findIndex(
    (inv) =>
      (String(inv._id) === String(id) || String(inv.id) === String(id)) &&
      String(inv.userId) === String(userId)
  );
  if (idx === -1) return null;

  invoices[idx] = {
    ...invoices[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeJson(INVOICES_FILE, invoices);
  return invoices[idx];
}

export async function listUserInvoices(
  userId: string,
  options: {
    status?: string | undefined;
    q?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
    customerId?: string | undefined;
    sort?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  } = {}
): Promise<{ invoices: any[]; total: number; page: number; totalPages: number }> {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;

  if (isMongoConnected()) {
    try {
      const query: any = { userId: userObjId };
      if (options.status) {
        query.status = options.status;
      }
      if (options.from || options.to) {
        query.invoiceDate = {};
        if (options.from) query.invoiceDate.$gte = options.from;
        if (options.to) query.invoiceDate.$lte = options.to;
      }
      if (options.q && options.q.trim()) {
        const qTerm = options.q.trim();
        query.$or = [
          { invoiceNumber: { $regex: qTerm, $options: "i" } },
          { "buyer.name": { $regex: qTerm, $options: "i" } },
        ];
      }

      let sortOptions: any = { createdAt: -1 };
      if (options.sort === "oldest") sortOptions = { createdAt: 1 };
      if (options.sort === "date_desc") sortOptions = { invoiceDate: -1 };
      if (options.sort === "date_asc") sortOptions = { invoiceDate: 1 };
      if (options.sort === "amount_desc") sortOptions = { "engineResult.grandTotal": -1 };
      if (options.sort === "amount_asc") sortOptions = { "engineResult.grandTotal": 1 };

      const total = await (InvoiceModel as any).countDocuments(query);
      const invoices = await (InvoiceModel as any).find(query)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return {
        invoices,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      };
    } catch (e) {
      console.warn("MongoDB listUserInvoices fallback:", e);
    }
  }

  let invoices = readJson<any>(INVOICES_FILE).filter((inv) => String(inv.userId) === String(userId));

  if (options.status) {
    invoices = invoices.filter((inv) => inv.status === options.status);
  }
  if (options.from) {
    invoices = invoices.filter((inv) => inv.invoiceDate >= options.from!);
  }
  if (options.to) {
    invoices = invoices.filter((inv) => inv.invoiceDate <= options.to!);
  }
  if (options.q && options.q.trim()) {
    const term = options.q.trim().toLowerCase();
    invoices = invoices.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(term) ||
        inv.buyer?.name?.toLowerCase().includes(term)
    );
  }

  if (options.sort === "oldest") {
    invoices.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (options.sort === "date_desc") {
    invoices.sort((a, b) => (b.invoiceDate || "").localeCompare(a.invoiceDate || ""));
  } else if (options.sort === "date_asc") {
    invoices.sort((a, b) => (a.invoiceDate || "").localeCompare(b.invoiceDate || ""));
  } else if (options.sort === "amount_desc") {
    invoices.sort((a, b) => (b.engineResult?.grandTotal || 0) - (a.engineResult?.grandTotal || 0));
  } else if (options.sort === "amount_asc") {
    invoices.sort((a, b) => (a.engineResult?.grandTotal || 0) - (b.engineResult?.grandTotal || 0));
  } else {
    invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const total = invoices.length;
  const paginated = invoices.slice((page - 1) * limit, page * limit);

  return {
    invoices: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getInvoiceMonthlySummary(userId: string, month?: string): Promise<any[]> {
  const userObjId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  let allInvoices: any[] = [];

  if (isMongoConnected()) {
    try {
      allInvoices = await (InvoiceModel as any).find({
        userId: userObjId,
        status: { $in: ["issued", "paid"] },
      }).lean();
    } catch (e) {
      console.warn("MongoDB getInvoiceMonthlySummary fallback:", e);
      allInvoices = readJson<any>(INVOICES_FILE).filter(
        (inv) => String(inv.userId) === String(userId) && (inv.status === "issued" || inv.status === "paid")
      );
    }
  } else {
    allInvoices = readJson<any>(INVOICES_FILE).filter(
      (inv) => String(inv.userId) === String(userId) && (inv.status === "issued" || inv.status === "paid")
    );
  }

  if (month && month.trim()) {
    allInvoices = allInvoices.filter((inv) => (inv.invoiceDate || "").startsWith(month.trim()));
  }

  interface MonthlySummaryItem {
    month: string;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
    grandTotal: number;
    invoiceCount: number;
    rateBreakdown: Record<string, { taxable: number; gst: number }>;
  }

  // Group by YYYY-MM
  const monthMap = new Map<string, MonthlySummaryItem>();

  for (const inv of allInvoices) {
    const invMonth = (inv.invoiceDate || "").slice(0, 7) || "Unknown";
    const res = inv.engineResult || {};

    let current = monthMap.get(invMonth);
    if (!current) {
      current = {
        month: invMonth,
        taxableValue: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalGst: 0,
        grandTotal: 0,
        invoiceCount: 0,
        rateBreakdown: {},
      };
      monthMap.set(invMonth, current);
    }

    current.taxableValue += Number(res.subtotal || 0);
    current.cgst += Number(res.totalCgst || 0);
    current.sgst += Number(res.totalSgst || 0);
    current.igst += Number(res.totalIgst || 0);
    current.totalGst += Number(res.totalGst || 0);
    current.grandTotal += Number(res.grandTotal || 0);
    current.invoiceCount += 1;

    if (Array.isArray(res.taxSummary)) {
      for (const item of res.taxSummary) {
        const rKey = String(item.rate);
        if (!current.rateBreakdown[rKey]) {
          current.rateBreakdown[rKey] = { taxable: 0, gst: 0 };
        }
        const entry = current.rateBreakdown[rKey]!;
        entry.taxable += Number(item.taxableAmount || 0);
        entry.gst += Number(item.totalGst || 0);
      }
    }

    monthMap.set(invMonth, current);
  }

  return Array.from(monthMap.values()).sort((a, b) => b.month.localeCompare(a.month));
}

