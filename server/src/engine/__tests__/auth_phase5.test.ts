import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../../index";
import { emailService } from "../../services/email.service";
import { resetLocalStoreForTesting } from "../../utils/localStore";

describe("Phase 5 Authentication, Profile, Calculations & Dashboard Integration Tests", () => {
  const csrfHeader = { "x-requested-with": "XMLHttpRequest" };

  beforeAll(() => {
    resetLocalStoreForTesting();
    emailService.clearCapturedEmails();
  });

  describe("Authentication Flow (Register, OTP, Login)", () => {
    const userEmail = "rahul.sharma@example.com";
    const userPassword = "StrongPassword@2026";
    let capturedOtp = "";

    it("prevents registration with trivial or common passwords", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .set(csrfHeader)
        .send({
          name: "Rahul Sharma",
          email: "badpass@example.com",
          password: "password",
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it("successfully registers a user and dispatches an OTP email without enumerating errors", async () => {
      const initialLogs = emailService.getCapturedEmails().length;
      const res = await request(app)
        .post("/api/auth/register")
        .set(csrfHeader)
        .send({
          name: "Rahul Sharma",
          email: userEmail,
          password: userPassword,
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(userEmail);
      expect(res.body.data.message).toBeDefined();

      const emails = emailService.getCapturedEmails();
      expect(emails.length).toBeGreaterThan(initialLogs);
      const lastEmail = emails[emails.length - 1]!;
      expect(lastEmail.to).toBe(userEmail);
      expect(lastEmail.subject).toContain("Verification Code");
      capturedOtp = lastEmail.otp || "";

      expect(capturedOtp).toMatch(/^\d{6}$/);
    });

    it("returns generic success message for duplicate registration (no account enumeration)", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .set(csrfHeader)
        .send({
          name: "Rahul Sharma",
          email: userEmail,
          password: userPassword,
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);

      const emails = emailService.getCapturedEmails();
      capturedOtp = emails.filter((e) => e.to === userEmail).pop()?.otp || capturedOtp;
    });

    it("blocks login before email is verified", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .set(csrfHeader)
        .send({
          email: userEmail,
          password: userPassword,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("EMAIL_NOT_VERIFIED");
    });

    it("rejects invalid OTP attempts", async () => {
      const res = await request(app)
        .post("/api/auth/verify-otp")
        .set(csrfHeader)
        .send({
          email: userEmail,
          otp: "000000",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_OTP");
    });

    it("verifies user with valid OTP and sets session cookies", async () => {
      const res = await request(app)
        .post("/api/auth/verify-otp")
        .set(csrfHeader)
        .send({
          email: userEmail,
          otp: capturedOtp,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(userEmail);
      expect(res.body.data.user.isEmailVerified).toBe(true);
      const cookies = (res.headers["set-cookie"] || []) as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes("access_token=") || c.includes("accessToken="))).toBe(true);
      expect(cookies.some((c: string) => c.includes("refresh_token=") || c.includes("refreshToken="))).toBe(true);
    });


    it("allows login once verified and sets auth cookies", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .set(csrfHeader)
        .send({
          email: userEmail,
          password: userPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(userEmail);
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("returns generic error for wrong credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .set(csrfHeader)
        .send({
          email: userEmail,
          password: "WrongPassword999",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("Token Refresh & Session Family Revocation", () => {
    let authCookies: string[] = [];
    const testEmail = "session.test@example.com";
    const testPass = "Pass12345678!";

    it("handles token refresh and revokes family on reuse", async () => {
      // Register & verify
      await request(app).post("/api/auth/register").set(csrfHeader).send({
        name: "Session User",
        email: testEmail,
        password: testPass,
      });
      const emails = emailService.getCapturedEmails();
      const otp = emails.filter((e) => e.to === testEmail).pop()?.otp!;
      const verifyRes = await request(app).post("/api/auth/verify-otp").set(csrfHeader).send({
        email: testEmail,
        otp,
      });
      authCookies = verifyRes.headers["set-cookie"] as unknown as string[];

      // First Refresh
      const refreshRes1 = await request(app)
        .post("/api/auth/refresh")
        .set(csrfHeader)
        .set("Cookie", authCookies);

      expect(refreshRes1.status).toBe(200);
      expect(refreshRes1.body.success).toBe(true);
      const newCookies = refreshRes1.headers["set-cookie"] as unknown as string[];
      expect(newCookies).toBeDefined();

      // Reusing the old refresh token (detected token replay / attack)
      const reuseRes = await request(app)
        .post("/api/auth/refresh")
        .set(csrfHeader)
        .set("Cookie", authCookies);

      expect(reuseRes.status).toBe(401);
      expect(reuseRes.body.success).toBe(false);
      expect(["REFRESH_TOKEN_REUSED", "SESSION_COMPROMISED"]).toContain(reuseRes.body.error.code);
    });
  });

  describe("Calculations CRUD & IDOR Protection", () => {
    let userACookies: string[] = [];
    let userBCookies: string[] = [];
    let userACalcId = "";

    it("authenticates two distinct users for IDOR testing", async () => {
      // User A
      await request(app).post("/api/auth/register").set(csrfHeader).send({
        name: "User Alpha",
        email: "alpha@example.com",
        password: "PasswordAlpha123",
      });
      let emails = emailService.getCapturedEmails();
      let otp = emails.filter((e) => e.to === "alpha@example.com").pop()?.otp!;
      const resA = await request(app).post("/api/auth/verify-otp").set(csrfHeader).send({
        email: "alpha@example.com",
        otp,
      });
      userACookies = resA.headers["set-cookie"] as unknown as string[];

      // User B
      await request(app).post("/api/auth/register").set(csrfHeader).send({
        name: "User Beta",
        email: "beta@example.com",
        password: "PasswordBeta123",
      });
      emails = emailService.getCapturedEmails();
      otp = emails.filter((e) => e.to === "beta@example.com").pop()?.otp!;
      const resB = await request(app).post("/api/auth/verify-otp").set(csrfHeader).send({
        email: "beta@example.com",
        otp,
      });
      userBCookies = resB.headers["set-cookie"] as unknown as string[];
    });

    it("saves income tax calculation and enforces server-side recomputation", async () => {
      const payload = {
        type: "income_tax",
        taxYear: "2026-27",
        inputs: {
          taxYear: "2026-27",
          ageGroup: "below60",
          salaryIncome: 1200000,
          otherIncome: 0,
          deductions: { sec80C: 150000 },
        },
        // Tampered client result which MUST be recomputed & ignored
        result: {
          recommended: "old",
          savings: 9999999,
        },
      };

      const res = await request(app)
        .post("/api/calculations")
        .set(csrfHeader)
        .set("Cookie", userACookies)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      userACalcId = res.body.data._id || res.body.data.id;
      expect(userACalcId).toBeDefined();

      // Ensure server recomputed the actual recommendation and didn't blindly accept savings: 9999999
      expect(res.body.data.result.recommended).toBe("new");
      expect(res.body.data.summary.bestTax).toBeDefined();
      expect(res.body.data.summary.savings).toBeLessThan(9999999);
    });

    it("User B cannot access User A's calculation (returns 404, not 403, for IDOR)", async () => {
      const res = await request(app)
        .get(`/api/calculations/${userACalcId}`)
        .set("Cookie", userBCookies);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CALCULATION_NOT_FOUND");
    });

    it("User B cannot rename User A's calculation (returns 404)", async () => {
      const res = await request(app)
        .patch(`/api/calculations/${userACalcId}`)
        .set(csrfHeader)
        .set("Cookie", userBCookies)
        .send({ name: "Hacked Name" });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("User B cannot delete User A's calculation (returns 404)", async () => {
      const res = await request(app)
        .delete(`/api/calculations/${userACalcId}`)
        .set(csrfHeader)
        .set("Cookie", userBCookies);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("User A can fetch their calculation list with search and pagination", async () => {
      const res = await request(app)
        .get("/api/calculations?type=income_tax")
        .set("Cookie", userACookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.calculations.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it("allows User A to recalculate an existing calculation", async () => {
      const res = await request(app)
        .post(`/api/calculations/${userACalcId}/recalculate`)
        .set(csrfHeader)
        .set("Cookie", userACookies);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.original).toBeDefined();
      expect(res.body.data.current).toBeDefined();
    });
  });

  describe("Real Dashboard Data API (/api/dashboard/summary)", () => {
    let testUserCookies: string[] = [];

    it("returns guest sample dashboard data when unauthenticated", async () => {
      const res = await request(app).get("/api/dashboard/summary?taxYear=2026-27");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isGuest).toBe(true);
      expect(res.body.data.kpis.estimatedTax.value).toBeGreaterThan(0);
      expect(res.body.data.kpis.taxSaved.value).toBeGreaterThan(0);
      expect(res.body.data.kpis.gstCalculated.value).toBeGreaterThan(0);
      expect(res.body.data.charts.regimeComparison.length).toBeGreaterThan(0);
      expect(res.body.data.recentActivity.length).toBeGreaterThan(0);
    });

    it("returns real user data after user saves calculations", async () => {
      // Register user
      const email = "dashboard.user@example.com";
      await request(app).post("/api/auth/register").set(csrfHeader).send({
        name: "Dashboard Tester",
        email,
        password: "SecurePassword123!",
      });
      const emails = emailService.getCapturedEmails();
      const otp = emails.filter((e) => e.to === email).pop()?.otp!;
      const verifyRes = await request(app).post("/api/auth/verify-otp").set(csrfHeader).send({
        email,
        otp,
      });
      testUserCookies = verifyRes.headers["set-cookie"] as unknown as string[];

      // Initially empty state
      const emptyRes = await request(app)
        .get("/api/dashboard/summary?taxYear=2026-27")
        .set("Cookie", testUserCookies);
      expect(emptyRes.status).toBe(200);
      expect(emptyRes.body.data.isGuest).toBe(false);
      expect(emptyRes.body.data.hasData).toBe(false);

      // Save 1 income tax calculation
      await request(app)
        .post("/api/calculations")
        .set(csrfHeader)
        .set("Cookie", testUserCookies)
        .send({
          type: "income_tax",
          taxYear: "2026-27",
          inputs: {
            taxYear: "2026-27",
            ageGroup: "below60",
            salaryIncome: 1800000,
            otherIncome: 50000,
            deductions: { sec80C: 150000 },
          },
        });

      // Save 1 GST calculation
      await request(app)
        .post("/api/calculations")
        .set(csrfHeader)
        .set("Cookie", testUserCookies)
        .send({
          type: "gst",
          taxYear: "2026-27",
          inputs: {
            amount: 100000,
            rate: 18,
            mode: "exclusive",
            sameState: true,
            sellerState: "27-Maharashtra",
            buyerState: "27-Maharashtra",
          },
        });

      // Fetch dashboard summary
      const summaryRes = await request(app)
        .get("/api/dashboard/summary?taxYear=2026-27")
        .set("Cookie", testUserCookies);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.data.isGuest).toBe(false);
      expect(summaryRes.body.data.hasData).toBe(true);
      expect(summaryRes.body.data.kpis.estimatedTax.value).toBeGreaterThan(0);
      // In Phase 6 formula, KPI 3 tracks GST collected on issued/paid invoices (0 when only calculations saved)
      expect(summaryRes.body.data.kpis.gstCalculated.value).toBe(0);
      expect(summaryRes.body.data.kpis.gstCalculated.badgeText).toBe("Create your first invoice");
      expect(summaryRes.body.data.recentActivity.length).toBe(2);
    });
  });

  describe("Account Management (Profile update, Password change, Deletion)", () => {
    let userCookies: string[] = [];
    const email = "manage.me@example.com";
    const pass = "PasswordToChange123";

    it("registers user for profile and deletion tests", async () => {
      await request(app).post("/api/auth/register").set(csrfHeader).send({
        name: "Manage Me",
        email,
        password: pass,
      });
      const emails = emailService.getCapturedEmails();
      const otp = emails.filter((e) => e.to === email).pop()?.otp!;
      const verifyRes = await request(app).post("/api/auth/verify-otp").set(csrfHeader).send({
        email,
        otp,
      });
      userCookies = verifyRes.headers["set-cookie"] as unknown as string[];
    });

    it("updates user profile preferences", async () => {
      const res = await request(app)
        .patch("/api/users/me")
        .set(csrfHeader)
        .set("Cookie", userCookies)
        .send({
          name: "Updated Name",
          language: "hi",
          theme: "dark",
          defaultState: "27-Maharashtra",
          ageGroup: "senior60to79",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Updated Name");
      expect(res.body.data.language).toBe("hi");
      expect(res.body.data.theme).toBe("dark");
    });

    it("changes password successfully", async () => {
      const res = await request(app)
        .post("/api/users/me/change-password")
        .set(csrfHeader)
        .set("Cookie", userCookies)
        .send({
          currentPassword: pass,
          newPassword: "BrandNewStrongPassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("deletes user account and purges data", async () => {
      const res = await request(app)
        .delete("/api/users/me")
        .set(csrfHeader)
        .set("Cookie", userCookies)
        .send({
          password: "BrandNewStrongPassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify user can no longer log in
      const loginRes = await request(app).post("/api/auth/login").set(csrfHeader).send({
        email,
        password: "BrandNewStrongPassword123!",
      });
      expect(loginRes.status).toBe(401);
    });
  });
});
