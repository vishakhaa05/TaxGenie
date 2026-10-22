import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../../index";
import { generateTestGstin } from "../gst/gstin";

describe("Thin API Layer Integration Tests", () => {
  describe("GET /api/rules/:taxYear", () => {
    it("returns active rules for valid tax year (2026-27)", async () => {
      const res = await request(app).get("/api/rules/2026-27");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.taxYear).toBe("2026-27");
      expect(res.body.data.newRegime).toBeDefined();
      expect(res.body.data.oldRegime).toBeDefined();
      expect(res.body.data.cess).toBe(4);
    });

    it("accepts '2026-2027' as equivalent normalized tax year", async () => {
      const res = await request(app).get("/api/rules/2026-2027");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.taxYear).toBe("2026-27");
    });

    it("returns 404 for unknown or unsupported tax year", async () => {
      const res = await request(app).get("/api/rules/1995-96");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("TAX_YEAR_NOT_FOUND");
    });
  });

  describe("POST /api/tax/calculate", () => {
    it("returns valid comparison between New and Old regimes", async () => {
      const payload = {
        ageGroup: "below60",
        salaryIncome: 1500000,
        otherIncome: 0,
        taxYear: "2026-27",
        deductions: {
          sec80C: 150000,
        },
      };

      const res = await request(app).post("/api/tax/calculate").send(payload);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.newRegime).toBeDefined();
      expect(res.body.data.oldRegime).toBeDefined();
      expect(res.body.data.recommended).toBe("new");
      expect(res.body.data.savings).toBeGreaterThan(0);
      expect(res.body.data.breakEven).toBeDefined();
    });

    it("returns 400 for invalid input payload", async () => {
      const invalidPayload = {
        ageGroup: "invalidAge",
        salaryIncome: -500,
        taxYear: "2026-27",
      };

      const res = await request(app)
        .post("/api/tax/calculate")
        .send(invalidPayload);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details).toBeDefined();
    });

    it("returns 404 if tax year does not exist", async () => {
      const payload = {
        ageGroup: "below60",
        salaryIncome: 800000,
        taxYear: "1999-00",
      };

      const res = await request(app).post("/api/tax/calculate").send(payload);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("TAX_YEAR_NOT_FOUND");
    });
  });

  describe("POST /api/gst/calculate", () => {
    it("returns accurate GST calculation with intra-state split", async () => {
      const payload = {
        amount: 50000,
        rate: 18,
        mode: "add",
        sellerState: "27",
        buyerState: "27",
        taxYear: "2026-27",
      };

      const res = await request(app).post("/api/gst/calculate").send(payload);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.base).toBe(50000);
      expect(res.body.data.gstAmount).toBe(9000);
      expect(res.body.data.cgst).toBe(4500);
      expect(res.body.data.sgst).toBe(4500);
      expect(res.body.data.total).toBe(59000);
      expect(res.body.data.supplyType).toBe("intra");
    });

    it("returns 400 for unsupported GST rate", async () => {
      const payload = {
        amount: 1000,
        rate: 28, // not in [0, 5, 18, 40]
        mode: "add",
        sellerState: "27",
        buyerState: "27",
      };

      const res = await request(app).post("/api/gst/calculate").send(payload);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNSUPPORTED_GST_RATE");
    });
  });

  describe("POST /api/gst/invoice-preview", () => {
    it("generates invoice breakdown, round-off, and amount in words", async () => {
      const payload = {
        items: [
          {
            name: "Consulting Service",
            quantity: 2,
            unitPrice: 1000,
            rate: 18,
          },
          {
            name: "Stationery",
            quantity: 1,
            unitPrice: 500,
            rate: 5,
          },
        ],
        sellerState: "Maharashtra",
        buyerState: "Maharashtra",
        priceIncludesGst: false,
      };

      const res = await request(app)
        .post("/api/gst/invoice-preview")
        .send(payload);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.subtotal).toBe(2500);
      expect(res.body.data.totalGst).toBe(385);
      expect(res.body.data.grandTotal).toBe(2885);
      expect(res.body.data.amountInWords).toBe(
        "Two Thousand Eight Hundred Eighty Five Rupees Only"
      );
    });

    it("returns 400 for empty items array", async () => {
      const payload = {
        items: [],
        sellerState: "27",
        buyerState: "27",
      };

      const res = await request(app)
        .post("/api/gst/invoice-preview")
        .send(payload);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/gst/validate-gstin", () => {
    it("validates a genuine GSTIN with correct checksum", async () => {
      const validGstin = generateTestGstin("27", "ABCDE1234F", "1");
      const res = await request(app)
        .post("/api/gst/validate-gstin")
        .send({ gstin: validGstin });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.details.stateCode).toBe("27");
    });

    it("reports invalid checksum for tampered GSTIN", async () => {
      const validGstin = generateTestGstin("27", "ABCDE1234F", "1");
      const tampered = `${validGstin.slice(0, 14)}${validGstin[14] === "A" ? "B" : "A"}`;

      const res = await request(app)
        .post("/api/gst/validate-gstin")
        .send({ gstin: tampered });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.valid).toBe(false);
      expect(res.body.data.reason).toBe("INVALID_CHECKSUM");
    });
  });
});
