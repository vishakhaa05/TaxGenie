import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../../index";
import { emailService } from "../../services/email.service";
import { resetLocalStoreForTesting } from "../../utils/localStore";
import { generateTestGstin } from "../gst/gstin";
import { calculateInvoice } from "../gst/invoice";
import { GstRulesConfig } from "../gst/types";

const testGstRules: GstRulesConfig = {
  supportedRates: [0, 5, 18, 40],
  defaultRate: 18,
};

describe("Phase 6 Invoices & Statutory Generator Integration Tests", () => {
  const csrfHeader = { "x-requested-with": "XMLHttpRequest" };

  let userACookie: string[] = [];
  let userBCookie: string[] = [];
  const userAEmail = "seller.invoice@example.com";
  const userBEmail = "rival.invoice@example.com";
  const testPassword = "StrongPassword@2026";

  const validSellerGstin = generateTestGstin("27", "ABCDE1234F", "1");
  const validBuyerGstin = generateTestGstin("29", "XYZAB5678C", "1");

  beforeAll(async () => {
    resetLocalStoreForTesting();
    emailService.clearCapturedEmails();

    // Register & Login User A
    await request(app)
      .post("/api/auth/register")
      .set(csrfHeader)
      .send({ name: "Seller User A", email: userAEmail, password: testPassword });
    const emailsA = emailService.getCapturedEmails();
    const otpA = emailsA[emailsA.length - 1]?.otp || "";
    await request(app)
      .post("/api/auth/verify-otp")
      .set(csrfHeader)
      .send({ email: userAEmail, otp: otpA });
    const loginA = await request(app)
      .post("/api/auth/login")
      .set(csrfHeader)
      .send({ email: userAEmail, password: testPassword });
    userACookie = loginA.headers["set-cookie"] as unknown as string[];

    // Register & Login User B
    await request(app)
      .post("/api/auth/register")
      .set(csrfHeader)
      .send({ name: "Rival User B", email: userBEmail, password: testPassword });
    const emailsB = emailService.getCapturedEmails();
    const otpB = emailsB[emailsB.length - 1]?.otp || "";
    await request(app)
      .post("/api/auth/verify-otp")
      .set(csrfHeader)
      .send({ email: userBEmail, otp: otpB });
    const loginB = await request(app)
      .post("/api/auth/login")
      .set(csrfHeader)
      .send({ email: userBEmail, password: testPassword });
    userBCookie = loginB.headers["set-cookie"] as unknown as string[];

    // Setup User A Business Profile
    await request(app)
      .put("/api/business-profile")
      .set(csrfHeader)
      .set("Cookie", userACookie)
      .send({
        legalName: "Sharma Enterprises",
        tradeName: "Sharma Tech Solutions",
        gstin: validSellerGstin,
        pan: "ABCDE1234F",
        address: "101 Nariman Point, Marine Drive",
        state: "Maharashtra",
        pincode: "400021",
        phone: "+91 9876543210",
        email: "billing@sharma.in",
        invoicePrefix: "INV",
        numberPadding: 4,
        resetEachFinancialYear: true,
        defaultPaymentTermsDays: 15,
        defaultNotes: "Thank you for your business.",
        defaultTerms: "Payment due within 15 days.",
        paymentDetailsText: "UPI ID: sharma@upi | HDFC Bank A/c 501002345678",
        signatureLabel: "Authorised Signatory",
      });
  });

  describe("1. Engine Calculation Scenarios", () => {
    it("2 x Rs 1,000 at 18% + 1 x Rs 500 at 5%, same state -> taxable 2,500.00, CGST 192.50, SGST 192.50, GST 385.00, grand total 2,885.00, amount in words", () => {
      const res = calculateInvoice(
        {
          items: [
            { name: "Item 1", quantity: 2, unitPrice: 1000, rate: 18 },
            { name: "Item 2", quantity: 1, unitPrice: 500, rate: 5 },
          ],
          sellerState: "Maharashtra",
          buyerState: "Maharashtra",
          priceIncludesGst: false,
        },
        testGstRules
      );

      expect(res.subtotal).toBe(2500);
      expect(res.totalCgst).toBe(192.5);
      expect(res.totalSgst).toBe(192.5);
      expect(res.totalIgst).toBe(0);
      expect(res.totalGst).toBe(385);
      expect(res.grandTotal).toBe(2885);
      expect(res.amountInWords).toBe("Two Thousand Eight Hundred Eighty Five Rupees Only");
    });

    it("Same items, different state -> IGST 385.00, no CGST/SGST", () => {
      const res = calculateInvoice(
        {
          items: [
            { name: "Item 1", quantity: 2, unitPrice: 1000, rate: 18 },
            { name: "Item 2", quantity: 1, unitPrice: 500, rate: 5 },
          ],
          sellerState: "Maharashtra",
          buyerState: "Karnataka",
          priceIncludesGst: false,
        },
        testGstRules
      );

      expect(res.subtotal).toBe(2500);
      expect(res.totalCgst).toBe(0);
      expect(res.totalSgst).toBe(0);
      expect(res.totalIgst).toBe(385);
      expect(res.totalGst).toBe(385);
      expect(res.grandTotal).toBe(2885);
    });

    it("Discount: 1 x Rs 1,000 with 10% discount at 18% -> taxable 900.00, GST 162.00, total 1,062.00", () => {
      const res = calculateInvoice(
        {
          items: [
            {
              description: "Service",
              quantity: 1,
              unitPrice: 1000,
              rate: 18,
              discountType: "percent",
              discountValue: 10,
            },
          ],
          sellerState: "Maharashtra",
          buyerState: "Maharashtra",
          priceIncludesGst: false,
        },
        testGstRules
      );

      expect(res.subtotal).toBe(900);
      expect(res.totalGst).toBe(162);
      expect(res.grandTotal).toBe(1062);
    });

    it("GST-inclusive: Rs 1,180 inclusive at 18% -> taxable 1,000.00, GST 180.00, total 1,180.00", () => {
      const res = calculateInvoice(
        {
          items: [{ description: "Inclusive Item", quantity: 1, unitPrice: 1180, rate: 18 }],
          sellerState: "Maharashtra",
          buyerState: "Maharashtra",
          priceIncludesGst: true,
        },
        testGstRules
      );

      expect(res.subtotal).toBe(1000);
      expect(res.totalGst).toBe(180);
      expect(res.grandTotal).toBe(1180);
    });

    it("Round-off: 1 x Rs 999.99 at 18% -> total 1,179.99 -> grand total 1,180.00, round-off +0.01", () => {
      const res = calculateInvoice(
        {
          items: [{ description: "Fractional Item", quantity: 1, unitPrice: 999.99, rate: 18 }],
          sellerState: "Maharashtra",
          buyerState: "Maharashtra",
          priceIncludesGst: false,
        },
        testGstRules
      );

      expect(res.subtotal).toBe(999.99);
      expect(res.totalBeforeRoundOff).toBe(1179.99);
      expect(res.roundOff).toBe(0.01);
      expect(res.grandTotal).toBe(1180);
    });

    it("Bill of supply charges zero GST and excludes tax breakdown", () => {
      const res = calculateInvoice(
        {
          documentType: "bill_of_supply",
          items: [{ description: "Exempt Goods", quantity: 2, unitPrice: 500, rate: 18 }],
          sellerState: "Maharashtra",
          buyerState: "Maharashtra",
          priceIncludesGst: false,
        },
        testGstRules
      );

      expect(res.subtotal).toBe(1000);
      expect(res.totalGst).toBe(0);
      expect(res.totalCgst).toBe(0);
      expect(res.totalSgst).toBe(0);
      expect(res.totalIgst).toBe(0);
      expect(res.grandTotal).toBe(1000);
      expect(res.documentType).toBe("bill_of_supply");
    });
  });

  describe("2. Invoices API, Anti-Tampering, Numbering & Immutability", () => {
    let createdInvoiceId = "";

    it("creates a draft with recomputed server totals, ignoring any client-sent totals", async () => {
      const res = await request(app)
        .post("/api/invoices")
        .set(csrfHeader)
        .set("Cookie", userACookie)
        .send({
          documentType: "tax_invoice",
          invoiceDate: "2026-10-15",
          dueDate: "2026-10-30",
          buyer: {
            name: "Acme Corp",
            gstin: validBuyerGstin,
            address: "42 MG Road, Bangalore",
            state: "Karnataka",
          },
          items: [
            {
              description: "Web Development Services",
              hsnSac: "998314",
              quantity: 2,
              unit: "HOURS",
              unitPrice: 1000,
              gstRate: 18,
            },
            {
              description: "Cloud Hosting Setup",
              hsnSac: "998315",
              quantity: 1,
              unit: "NOS",
              unitPrice: 500,
              gstRate: 5,
            },
          ],
          // Tampered values sent by malicious client
          subtotal: 100,
          grandTotal: 100,
          totalGst: 0,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const invoice = res.body.data;
      createdInvoiceId = invoice._id || invoice.id;

      // Draft carries no invoice number
      expect(invoice.status).toBe("draft");
      expect(invoice.invoiceNumber).toBeUndefined();

      // Server recomputed totals: 2500 taxable, 385 IGST (Inter-state: MH to KA), grand total 2885
      expect(invoice.engineResult.subtotal).toBe(2500);
      expect(invoice.engineResult.totalIgst).toBe(385);
      expect(invoice.engineResult.grandTotal).toBe(2885);
    });

    it("allows editing drafts and recomputes totals", async () => {
      const res = await request(app)
        .patch(`/api/invoices/${createdInvoiceId}`)
        .set(csrfHeader)
        .set("Cookie", userACookie)
        .send({
          items: [
            {
              description: "Web Development Services (Updated)",
              quantity: 1,
              unitPrice: 1000,
              gstRate: 18,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.engineResult.subtotal).toBe(1000);
      expect(res.body.data.engineResult.grandTotal).toBe(1180);
    });

    it("issues invoice: assigns sequential INV-0001 number, snapshots seller & buyer, and becomes immutable", async () => {
      const res = await request(app)
        .post(`/api/invoices/${createdInvoiceId}/issue`)
        .set(csrfHeader)
        .set("Cookie", userACookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const issued = res.body.data;

      expect(issued.status).toBe("issued");
      expect(issued.invoiceNumber).toBe("INV-0001");
      expect(issued.seller.legalName).toBe("Sharma Enterprises");
      expect(issued.seller.gstin).toBe(validSellerGstin);

      // Attempting to PATCH or DELETE the issued invoice fails
      const patchRes = await request(app)
        .patch(`/api/invoices/${createdInvoiceId}`)
        .set(csrfHeader)
        .set("Cookie", userACookie)
        .send({ notes: "Attempted edit" });
      expect(patchRes.status).toBe(400);
      expect(patchRes.body.error.code).toBe("INVOICE_NOT_EDITABLE");

      const delRes = await request(app)
        .delete(`/api/invoices/${createdInvoiceId}`)
        .set(csrfHeader)
        .set("Cookie", userACookie);
      expect(delRes.status).toBe(400);
      expect(delRes.body.error.code).toBe("INVOICE_NOT_EDITABLE");
    });

    it("marks invoice as paid and can mark unpaid back to issued", async () => {
      const paidRes = await request(app)
        .post(`/api/invoices/${createdInvoiceId}/mark-paid`)
        .set(csrfHeader)
        .set("Cookie", userACookie);
      expect(paidRes.status).toBe(200);
      expect(paidRes.body.data.status).toBe("paid");
      expect(paidRes.body.data.paidAt).toBeDefined();

      const unpaidRes = await request(app)
        .post(`/api/invoices/${createdInvoiceId}/mark-unpaid`)
        .set(csrfHeader)
        .set("Cookie", userACookie);
      expect(unpaidRes.status).toBe(200);
      expect(unpaidRes.body.data.status).toBe("issued");
    });

    it("cancelling an invoice retains invoice number and records cancelledAt", async () => {
      const cancelRes = await request(app)
        .post(`/api/invoices/${createdInvoiceId}/cancel`)
        .set(csrfHeader)
        .set("Cookie", userACookie);
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.status).toBe("cancelled");
      expect(cancelRes.body.data.invoiceNumber).toBe("INV-0001");
      expect(cancelRes.body.data.cancelledAt).toBeDefined();
    });

    it("20 parallel issue requests assign 20 unique sequential numbers without duplicates", async () => {
      // Create 20 drafts
      const createPromises = Array.from({ length: 20 }, (_, i) =>
        request(app)
          .post("/api/invoices")
          .set(csrfHeader)
          .set("Cookie", userACookie)
          .send({
            documentType: "tax_invoice",
            invoiceDate: "2026-10-15",
            dueDate: "2026-10-30",
            buyer: { name: `Client ${i + 1}`, address: "Address", state: "Maharashtra" },
            items: [{ description: `Item ${i + 1}`, quantity: 1, unitPrice: 100, gstRate: 18 }],
          })
      );
      const drafts = await Promise.all(createPromises);
      const draftIds = drafts.map((d) => d.body.data._id || d.body.data.id);

      // Issue all 20 in parallel
      const issuePromises = draftIds.map((id) =>
        request(app)
          .post(`/api/invoices/${id}/issue`)
          .set(csrfHeader)
          .set("Cookie", userACookie)
      );
      const results = await Promise.all(issuePromises);

      const assignedNumbers = results.map((r) => r.body.data.invoiceNumber);
      expect(assignedNumbers.length).toBe(20);

      const uniqueNumbers = new Set(assignedNumbers);
      expect(uniqueNumbers.size).toBe(20);

      // Starts from INV-0002 up to INV-0021
      expect(assignedNumbers).toContain("INV-0002");
      expect(assignedNumbers).toContain("INV-0021");
    });
  });

  describe("3. Seller GSTIN, Bill of Supply & Validation Rules", () => {
    it("rejects Tax Invoice issue if seller has no GSTIN with SELLER_GSTIN_REQUIRED", async () => {
      // User B has no business profile with GSTIN
      const draftRes = await request(app)
        .post("/api/invoices")
        .set(csrfHeader)
        .set("Cookie", userBCookie)
        .send({
          documentType: "tax_invoice",
          invoiceDate: "2026-10-20",
          buyer: { name: "Retail Buyer", address: "City", state: "Maharashtra" },
          items: [{ description: "Service", quantity: 1, unitPrice: 500, gstRate: 18 }],
        });

      const draftId = draftRes.body.data._id || draftRes.body.data.id;

      // User B attempts to issue without profile
      const issueRes = await request(app)
        .post(`/api/invoices/${draftId}/issue`)
        .set(csrfHeader)
        .set("Cookie", userBCookie);

      expect(issueRes.status).toBe(400);
      expect(issueRes.body.error.code).toBe("PROFILE_REQUIRED");

      // Now set profile WITHOUT GSTIN for User B
      await request(app)
        .put("/api/business-profile")
        .set(csrfHeader)
        .set("Cookie", userBCookie)
        .send({
          legalName: "Unregistered Freelancer",
          address: "24 Park St",
          state: "Delhi",
          pincode: "110001",
        });

      const issueTaxRes = await request(app)
        .post(`/api/invoices/${draftId}/issue`)
        .set(csrfHeader)
        .set("Cookie", userBCookie);

      expect(issueTaxRes.status).toBe(400);
      expect(issueTaxRes.body.error.code).toBe("SELLER_GSTIN_REQUIRED");

      // But User B CAN issue a Bill of Supply with zero tax!
      await request(app)
        .patch(`/api/invoices/${draftId}`)
        .set(csrfHeader)
        .set("Cookie", userBCookie)
        .send({ documentType: "bill_of_supply" });

      const issueBosRes = await request(app)
        .post(`/api/invoices/${draftId}/issue`)
        .set(csrfHeader)
        .set("Cookie", userBCookie);

      expect(issueBosRes.status).toBe(200);
      expect(issueBosRes.body.data.documentType).toBe("bill_of_supply");
      expect(issueBosRes.body.data.engineResult.totalGst).toBe(0);
    });

    it("rejects invalid buyer GSTIN with GSTIN_INVALID", async () => {
      const res = await request(app)
        .post("/api/invoices")
        .set(csrfHeader)
        .set("Cookie", userACookie)
        .send({
          buyer: {
            name: "Bad GSTIN Corp",
            gstin: "99INVALIDGSTIN99", // Bad GSTIN
            address: "Address",
            state: "Maharashtra",
          },
          items: [{ description: "Item", quantity: 1, unitPrice: 100, gstRate: 18 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("4. Security, IDOR Protection & Payload Sanitization", () => {
    let userAInvoiceId = "";

    beforeAll(async () => {
      const res = await request(app)
        .post("/api/invoices")
        .set(csrfHeader)
        .set("Cookie", userACookie)
        .send({
          documentType: "tax_invoice",
          invoiceDate: "2026-10-15",
          buyer: { name: "Client A", address: "City", state: "Maharashtra" },
          items: [{ description: "Consulting", quantity: 1, unitPrice: 2000, gstRate: 18 }],
        });
      userAInvoiceId = res.body.data._id || res.body.data.id;
    });

    it("User B cannot view User A's invoice (returns 404, not 403, for IDOR)", async () => {
      const res = await request(app)
        .get(`/api/invoices/${userAInvoiceId}`)
        .set("Cookie", userBCookie);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("INVOICE_NOT_FOUND");
    });

    it("User B cannot edit, issue, cancel, duplicate, or download User A's invoice", async () => {
      const patchRes = await request(app)
        .patch(`/api/invoices/${userAInvoiceId}`)
        .set(csrfHeader)
        .set("Cookie", userBCookie)
        .send({ notes: "Hijack" });
      expect(patchRes.status).toBe(404);

      const issueRes = await request(app)
        .post(`/api/invoices/${userAInvoiceId}/issue`)
        .set(csrfHeader)
        .set("Cookie", userBCookie);
      expect(issueRes.status).toBe(404);

      const pdfRes = await request(app)
        .get(`/api/invoices/${userAInvoiceId}/pdf`)
        .set("Cookie", userBCookie);
      expect(pdfRes.status).toBe(404);
    });

    it("blocks unauthenticated requests with 401", async () => {
      const res = await request(app).get(`/api/invoices/${userAInvoiceId}`);
      expect(res.status).toBe(401);
    });

    it("rejects malicious body keys containing $ or .", async () => {
      const res = await request(app)
        .post("/api/invoices")
        .set(csrfHeader)
        .set("Cookie", userACookie)
        .send({
          "$where": "sleep(5000)",
          items: [{ description: "Normal", quantity: 1, unitPrice: 100, gstRate: 18 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_PAYLOAD");
    });

    it("rejects invoices with more than 50 line items", async () => {
      const items = Array.from({ length: 51 }, (_, i) => ({
        description: `Item ${i + 1}`,
        quantity: 1,
        unitPrice: 10,
        gstRate: 18,
      }));

      const res = await request(app)
        .post("/api/invoices")
        .set(csrfHeader)
        .set("Cookie", userACookie)
        .send({ items });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("5. PDF Generation & Guest Endpoint", () => {
    it("generates a valid binary PDF with correct Content-Type and sanitized filename", async () => {
      // Create and issue an invoice for User A
      const createRes = await request(app)
        .post("/api/invoices")
        .set(csrfHeader)
        .set("Cookie", userACookie)
        .send({
          documentType: "tax_invoice",
          invoiceDate: "2026-10-15",
          dueDate: "2026-10-30",
          buyer: {
            name: "Bangalore Tech Corp",
            gstin: validBuyerGstin,
            address: "Tech Park, Bangalore",
            state: "Karnataka",
          },
          items: [
            {
              description: "Full Stack Architecture Services",
              hsnSac: "998314",
              quantity: 2,
              unit: "HOURS",
              unitPrice: 1000,
              gstRate: 18,
            },
          ],
        });

      const invId = createRes.body.data._id || createRes.body.data.id;
      await request(app).post(`/api/invoices/${invId}/issue`).set(csrfHeader).set("Cookie", userACookie);

      const pdfRes = await request(app)
        .get(`/api/invoices/${invId}/pdf`)
        .set("Cookie", userACookie);

      expect(pdfRes.status).toBe(200);
      expect(pdfRes.headers["content-type"]).toBe("application/pdf");
      expect(pdfRes.headers["content-disposition"]).toMatch(/attachment; filename="INV-.*\.pdf"/);

      // Verify binary starts with %PDF
      const buffer = pdfRes.body as Buffer;
      expect(buffer.slice(0, 4).toString()).toBe("%PDF");
      expect(buffer.length).toBeGreaterThan(1000);
    });

    it("guest PDF endpoint works statelessly without login and stores nothing", async () => {
      const guestRes = await request(app)
        .post("/api/invoices/pdf")
        .send({
          documentType: "tax_invoice",
          invoiceNumber: "GUEST-001",
          invoiceDate: "2026-10-25",
          seller: {
            legalName: "Guest Freelancer Studio",
            gstin: validSellerGstin,
            address: "Churchgate, Mumbai",
            state: "Maharashtra",
          },
          buyer: {
            name: "Direct Client",
            address: "Pune",
            state: "Maharashtra",
          },
          items: [
            {
              description: "Logo Design",
              quantity: 1,
              unitPrice: 5000,
              gstRate: 18,
            },
          ],
        });

      expect(guestRes.status).toBe(200);
      expect(guestRes.headers["content-type"]).toBe("application/pdf");
      const buf = guestRes.body as Buffer;
      expect(buf.slice(0, 4).toString()).toBe("%PDF");
    });
  });

  describe("6. CSV Export & Formula Injection Prevention", () => {
    it("exports CSV with formula injection protection (prefixing =, +, -, @ with ')", async () => {
      // Create a customer with a potentially malicious formula name
      const maliciousName = "=HYPERLINK(\"http://evil.com\")";
      await request(app)
        .post("/api/invoices")
        .set(csrfHeader)
        .set("Cookie", userACookie)
        .send({
          buyer: {
            name: maliciousName,
            address: "Malicious Address",
            state: "Maharashtra",
          },
          items: [{ description: "Product", quantity: 1, unitPrice: 100, gstRate: 18 }],
        });

      const csvRes = await request(app)
        .get("/api/invoices/export.csv")
        .set("Cookie", userACookie);

      expect(csvRes.status).toBe(200);
      expect(csvRes.headers["content-type"]).toContain("text/csv");
      const csvContent = csvRes.text;

      // Header row must be present
      expect(csvContent).toContain("Invoice Number,Date,Due Date,Document Type");
      // Malicious formula cell must be prefixed with a single quote
      expect(csvContent).toContain("'=HYPERLINK");
    });
  });

  describe("7. Customer Management CRUD", () => {
    let customerId = "";

    it("creates, searches, updates, and deletes customers", async () => {
      // Create customer
      const createRes = await request(app)
        .post("/api/customers")
        .set(csrfHeader)
        .set("Cookie", userACookie)
        .send({
          name: "Infosys BPO Ltd",
          gstin: validBuyerGstin,
          address: "Electronics City, Hosur Road",
          state: "Karnataka",
          email: "procurement@infosys.com",
          phone: "+91 80 2852 0261",
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      customerId = createRes.body.data._id || createRes.body.data.id;

      // List & search customer
      const listRes = await request(app)
        .get("/api/customers?q=Infosys")
        .set("Cookie", userACookie);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBe(1);
      expect(listRes.body.data[0].name).toBe("Infosys BPO Ltd");

      // Update customer
      const updateRes = await request(app)
        .patch(`/api/customers/${customerId}`)
        .set(csrfHeader)
        .set("Cookie", userACookie)
        .send({ phone: "+91 80 9999 9999" });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.phone).toBe("+91 80 9999 9999");

      // User B cannot access User A's customer
      const rivalGet = await request(app)
        .get(`/api/customers/${customerId}`)
        .set("Cookie", userBCookie);
      expect(rivalGet.status).toBe(404);

      // Delete customer
      const delRes = await request(app)
        .delete(`/api/customers/${customerId}`)
        .set(csrfHeader)
        .set("Cookie", userACookie);
      expect(delRes.status).toBe(200);
    });
  });

  describe("8. Dashboard Integration & Monthly Summary", () => {
    it("aggregates monthly summary and updates Dashboard KPI 3 and recent activity", async () => {
      const summaryRes = await request(app)
        .get("/api/invoices/summary")
        .set("Cookie", userACookie);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.success).toBe(true);
      expect(Array.isArray(summaryRes.body.data)).toBe(true);

      const dashboardRes = await request(app)
        .get("/api/dashboard/summary?taxYear=2026-27")
        .set("Cookie", userACookie);

      expect(dashboardRes.status).toBe(200);
      const dash = dashboardRes.body.data;

      // KPI 3 reflects GST collected from issued/paid invoices
      expect(dash.kpis.gstCalculated).toBeDefined();
      expect(dash.kpis.gstCalculated.sparklineData.length).toBe(8); // 8-week weekly sparkline
      expect(dash.kpis.gstCalculated.hasData).toBe(true);

      // Recent activity merges both calculations and invoices
      expect(dash.recentActivity.length).toBeGreaterThan(0);
      const hasInvoiceActivity = dash.recentActivity.some(
        (act: any) => act.type === "invoice"
      );
      expect(hasInvoiceActivity).toBe(true);
    });
  });
});
