# 🧞 TaxGenie — Complete AI-Powered Financial & Tax Operating System

**TaxGenie** is an enterprise-grade, full-stack financial SaaS platform designed for individuals, salaried employees, freelancers, and small businesses. It combines real-time transaction tracking, automated receipt scanning (OCR), Indian Income Tax regime optimization (Old vs New), AI-powered financial advisory, cash flow forecasting, business GST analytics, and automated monthly financial report delivery.

---

## ✨ Features Overview

### 🏛️ 1. Tax Optimizer Center (`/tax-optimizer`)
* **Old vs. New Regime Comparison**: Real-time side-by-side computation of tax liability, standard deduction, 80C, 80D, HRA, Home Loan interest, 87A rebate, and 4% cess.
* **Auto-Pull Deductions**: Auto-extracts eligible tax deduction transactions directly from your database history.
* **Dynamic Slabs**: Source of truth calculations powered by backend `TaxSlabConfigModel` for FY 2026-2027 (AY 2027-2028).

### 🤖 2. TaxGenie AI Financial Advisor (`/ai-advisor`)
* **Interactive Gemini AI Chatbot**: Financial assistant analyzing 30-day transaction history without exposing private API keys.
* **Spending Anomaly Alerts**: Automatic warning system detecting single expenses exceeding 2.5x category averages.
* **Emergency Fund & Savings Advisor**: Calculates 6-month emergency fund deficit and monthly asset allocation across risk profiles (`CONSERVATIVE`, `MODERATE`, `AGGRESSIVE`).
* **Investment Education 101**: Teaches core concepts (Index Funds, FDs, PPF, NPS, ELSS) with educational disclaimers.

### 🏢 3. Business Finance Command Center (`/business`)
* **SMB & Freelancer Mode**: Revenue, Vendor Expenses, Pre-tax Net Profit, and Claimable GST Input Tax Credit tracking.
* **Client / Vendor Analytics**: Client & vendor ledger management.

### 📈 4. Financial Health & Cash Flow Forecasting (`/forecasting`)
* **TaxGenie Health Score**: 0-100 algorithm evaluating Savings Rate, Expense Control, Emergency Liquidity, and Recurring Obligation Stability.
* **7/30/90-Day Cash Flow Projections**: Anticipates expected inflows, outflows, and projected balances.

### 📁 5. Tax Documents Vault (`/tax-documents`)
* Encrypted user document storage organized by sections (`80C`, `80D`, `HRA`, `Home Loan`, `Salary / Form 16`, `Business Expenses`).

### 💳 6. 7-Day Free Trial & Subscription Management (`/settings/billing`)
* Automatic 7-day free trial initialization upon user sign-up with live days-remaining timer.
* Upgrades to Pro (₹499/mo) or Business (₹1,499/mo) plans.

---

## 🛠️ Technology Stack

* **Frontend**: React 19, Vite, TypeScript, Redux Toolkit, RTK Query, Redux Persist, Tailwind CSS, Radix UI, Recharts, Lucide Icons, React Router v7.
* **Backend**: Node.js, Express 5, TypeScript, MongoDB (Mongoose ODM), Passport.js JWT Authentication, Google GenAI SDK (`@google/genai`), Cloudinary, Resend, Node-Cron.
* **DevOps**: Docker, Docker Compose, Nginx, GitHub Actions CI/CD workflows.

---

## 🚀 Getting Started

### Prerequisites
* Node.js v20+
* MongoDB database (Local or MongoDB Atlas)

### Local Environment Setup

1. **Clone Repository & Install Dependencies**:
   ```bash
   # Backend Setup
   cd Backend
   npm install

   # Frontend Setup
   cd ../Client
   npm install
   ```

2. **Configure Environment Variables**:
   * Copy `Backend/.env.example` to `Backend/.env` and update credentials.
   * Copy `Client/.env.example` to `Client/.env`.

3. **Run Application**:
   * **Start Backend Server**:
     ```bash
     cd Backend
     npm run dev
     ```
   * **Start Client Server**:
     ```bash
     cd Client
     npm run dev
     ```
   * Open `http://localhost:5173` in your browser.

---

## 🐳 Docker Deployment

Run the entire application stack in containerized environment:

```bash
docker-compose up --build
```
* Client will be available at `http://localhost:5173`
* Backend API will be available at `http://localhost:8000/api`

---

## 🔒 Security & Privacy

* **Ownership Verification**: All financial queries enforce strict `userId` scoping on server side.
* **API Secret Protection**: Gemini, Cloudinary, Resend, and JWT secrets remain strictly server-side.
* **Stateless Authentication**: JWT tokens signed with HS256 algorithm and passport bearer extraction.

---

## 📄 License
ISC License © TaxGenie Platform
