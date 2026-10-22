import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { TaxYearRules } from "../engine/tax/types";
import TaxSlabConfigModel from "../models/tax-slab-config.model";

interface CacheEntry {
  rules: TaxYearRules;
  expiresAt: number;
}

// In-memory cache with TTL (5 minutes)
const RULES_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export class RulesService {
  /**
   * Normalizes tax year string (e.g., "2026-27", "2026-2027", "FY2026-27") into standard "2026-27".
   */
  public static normalizeTaxYear(rawYear: string): string {
    if (!rawYear || typeof rawYear !== "string") return "";
    const clean = rawYear.trim().replace(/^FY\s*/i, "").replace(/_/g, "-");
    if (clean === "2026-2027" || clean === "2026-27") {
      return "2026-27";
    }
    return clean;
  }

  /**
   * Loads seed rules from JSON file as standard fallback.
   */
  public static getSeedRules(normalizedYear: string): TaxYearRules | null {
    if (normalizedYear === "2026-27") {
      try {
        const filePath = path.join(__dirname, "../seed/taxRulesFY2026_27.json");
        const content = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(content) as TaxYearRules;
      } catch (err) {
        console.error("Could not read taxRulesFY2026_27.json seed file:", err);
      }
    }
    return null;
  }

  /**
   * Loads rules by tax year. First checks in-memory cache, then DB, then seed file.
   * Returns null if the tax year is not supported.
   */
  public static async getRulesForYear(taxYear: string): Promise<TaxYearRules | null> {
    const normalized = this.normalizeTaxYear(taxYear);
    if (!normalized) return null;

    // 1. Check in-memory cache
    const now = Date.now();
    const cached = RULES_CACHE.get(normalized);
    if (cached && cached.expiresAt > now) {
      return cached.rules;
    }

    let rules: TaxYearRules | null = null;

    // 2. Check DB if connected
    if (mongoose.connection.readyState === 1) {
      try {
        const dbDoc = await TaxSlabConfigModel.findOne({
          $or: [
            { financialYear: normalized },
            { financialYear: "2026-2027" },
          ],
        }).lean();

        if (dbDoc && (dbDoc as any).newRegime?.slabs) {
          // If DB record has full engine format, use it; otherwise augment with seed
          const seed = this.getSeedRules(normalized);
          if (seed) {
            rules = {
              ...seed,
              taxYear: normalized,
            };
          }
        }
      } catch (err) {
        console.warn("DB query for tax rules failed, falling back to seed:", err);
      }
    }

    // 3. Fallback to seed file
    if (!rules) {
      rules = this.getSeedRules(normalized);
    }

    if (rules) {
      // Save to cache
      RULES_CACHE.set(normalized, {
        rules,
        expiresAt: now + CACHE_TTL_MS,
      });
    }

    return rules;
  }

  /**
   * Clears in-memory rules cache (useful for testing or after updating rules).
   */
  public static clearCache(): void {
    RULES_CACHE.clear();
  }
}
