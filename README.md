# Anderson Direct Transport - Digital Freight Brokerage Platform

> **Company:** Anderson Direct Transport  
> **Core Workflow:** Rate Quote → Load Board → Dispatch → BOL/POD → Settlement  
> **Architecture:** Modular, service-oriented, feature-driven versioning

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+
- PostgreSQL 14+
- Redis (for queues)

### Installation & Startup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd brokerage
   npm install
   ```

2. **Start all services:**
   ```bash
   # Windows
   start-clearhaul.bat
   
   # Or manually
   npm run dev
   ```

3. **Access the applications:**
   - **Shipper Portal:** http://localhost:3000
   - **Carrier App:** http://localhost:3001  
   - **Broker Console:** http://localhost:3002
   - **API Gateway:** http://localhost:3003
   - **API Documentation:** http://localhost:3003/api/docs

## 🏗️ Architecture

### Frontend Applications
- **Shipper Portal** - Rate quote requests, load bookings, freight tracking, invoices, ESG reports
- **Carrier App** - Load board access, freight tracking, BOL/POD upload, settlements
- **Broker Console** - Exception handling, carrier vetting, disputes, settlements

### Backend Services
- **API Gateway** - Authentication, routing, rate limiting
- **Pricing Service** - Lane rates, fuel surcharge, dynamic pricing
- **Matching Service** - AI-powered carrier ranking and selection
- **Load Board Service** - Load posting and carrier matching workflow
- **Compliance Service** - TrustShield fraud detection, FMCSA compliance, OCR
- **Settlement Service** - Apex Pay instant payments, invoicing, carrier settlements
- **Documents Service** - BOL/POD OCR, storage, e-signatures
- **Telemetry Service** - GPS tracking, ETA calculations, exceptions
- **Carbon Service** - CO₂ calculations, ESG reporting
- **Notify Service** - Email/SMS/push notifications, webhooks

### Shared Packages
- **@clearhaul/types** - Zod schemas and TypeScript types
- **@clearhaul/ui** - Shared UI components (shadcn/ui)
- **@clearhaul/sdk-js** - TypeScript SDK for API integration
- **@clearhaul/workers** - Background job processing

## 📊 Core Workflows

### 1. Brokering Flow
```
Shipper Request → Rate Quote → Load Board Posting → 
Carrier Booking → Dispatch → GPS Tracking → BOL/POD Upload → 
Auto-Invoice → Apex Pay Settlement
```

### 2. TrustShield (Fraud Prevention)
```
Multi-factor Identity → MC# Verification → DOT# Validation → Bank Validation → 
Phone Verification → AI Anomaly Detection → Trust Score
```

### 3. Apex Pay (Financial Velocity)
```
Instant RTP/ACH → Low-fee Factoring → Automated Invoicing → 
Quick-Pay Options → Real-time Carrier Settlement
```

## 🛡️ Security & Compliance

- **Authentication:** JWT with short TTL, mTLS for service communication
- **Authorization:** Role-based access control (RBAC)
- **Data Protection:** PII encryption at rest, signed S3 URLs
- **Audit:** Immutable audit logs, event sourcing
- **Compliance:** FMCSA authority verification, ESG (CSRD), SOC2 ready

## 📈 Analytics & ESG

- **Performance Metrics:** On-time delivery rates, damage rates, carrier performance scores
- **Market Intelligence:** Lane analytics, rate forecasting
- **Carbon Tracking:** CO₂ per load, ESG compliance reports
- **Business Intelligence:** Margin analysis, SLA dashboards

## 🚀 Deployment

### Development
```bash
npm run dev          # Start all services
npm run build        # Build all packages
npm run test         # Run all tests
npm run lint         # Lint all code
```

### Production
```bash
npm run build
npm run start:prod
```

## 📋 Roadmap

- **v0.1** - Brokering Core (pricing, matching, load board, BOL/POD, sandbox settlements)
- **v0.2** - Compliance & Trust (TrustShield, fraud detection, FMCSA verification)
- **v0.3** - Telemetry & Exceptions (GPS, ETA, exception handling)
- **v0.4** - Analytics & ESG (dashboards, CO₂ tracking)
- **v0.5** - Dynamic Pricing v2 (LightGBM models, forecasting)
- **v0.6** - Fintech Rails (instant payments, factoring)
- **v0.7** - Load Board APIs (DAT/Truckstop integration)
- **v1.0** - GA (SSO, audit logs, settlements, SLA guarantees)

## 💰 Business Model

### Revenue Streams
1. **Commission:** 15% take on gross margin
2. **Apex Pay:** 2.5% instant settlement fees
3. **SaaS Tiers:**
   - Freemium: Basic load board access
   - Pro ($150/mo): Workflow + TrustShield
   - Enterprise ($300/mo): Pro + Apex IQ + ESG

### 5-Year Projections
- **Year 5 GMV:** $11.5B
- **Total Revenue:** ~$194M
- **Gross Margin:** ~85%
- **EBITDA Positive:** Year 3

## 🔧 Technology Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind, shadcn/ui, React Query
- **Backend:** NestJS, FastAPI, event-driven architecture
- **Database:** PostgreSQL + pgvector, Redis cache
- **AI/ML:** Heuristics → LightGBM, OR-Tools, OpenAI embeddings
- **Infrastructure:** AWS (EKS/RDS/S3/MSK), Terraform, Kubernetes
- **Observability:** OpenTelemetry, Grafana, Sentry

## 📞 Support

For technical support or business inquiries:
- **Email:** support@clearhaul.com
- **Documentation:** [docs.clearhaul.com](https://docs.clearhaul.com)
- **Status:** [status.clearhaul.com](https://status.clearhaul.com)

---

**Clearhaul** - Transforming freight transportation through technology, trust, and transparency.
