<div align="center">

<img src="https://img.shields.io/badge/HospitPro-StayNEat-6C3EF4?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMSAxNEg5VjhoMnY4em00IDBoLTJWOGgydjh6Ii8+PC9zdmc+" alt="HospitPro Banner"/>

# 🏨 HospitPro — *StayNEat*

### All-in-One Hospitality SaaS Platform

*Empowering hotels & restaurants across India with next-generation digital tools*

[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=flat-square&logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=flat-square)](LICENSE)

</div>

---

## 🌟 What is HospitPro (StayNEat)?

**HospitPro**, also known as **StayNEat**, is a high-performance, multi-tenant SaaS platform built for the modern hospitality industry. It gives hotel and restaurant owners a powerful, unified suite to manage bookings, digital menus, and real-time orders — all under their own branded subdomain.

> 💡 **Built for India's small businesses** — affordable, scalable, and AI-agent-ready.

---

## 🚀 Core Value Proposition

| Feature | Description |
|---|---|
| 🏢 **Multi-Tenancy** | Each business gets a unique slug-based URL (e.g., `/h/grand-palace`) with fully isolated data and custom branding |
| 🔺 **Three-Tier Architecture** | Dedicated dashboards for Super Admins, Business Owners, and a seamless Customer checkout flow |
| 🤖 **Agent-Ready Codebase** | Optimized for AI-assisted development (Claude Code / Cursor) with strict TypeScript types and modular components |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14+ (App Router, Server Actions, TypeScript) |
| **Styling** | Tailwind CSS v3 — Custom Palette: `#6C3EF4` / `#F59E0B` |
| **Database** | Prisma ORM with MongoDB |
| **Authentication** | NextAuth.js v5 (Google OAuth & Credentials) |
| **Payments** | Razorpay (Server-side integration & Subscriptions) |
| **Infrastructure** | Cloudinary (Images), Resend (Emails), Vercel (Hosting) |
| **Real-time & State** | TanStack Query, Framer Motion, Zustand |

---

## ✨ Key Features

### 🏨 For Hotels

- **Dynamic Room Management** — Multi-image uploads via Cloudinary, amenity tagging, and real-time availability logic
- **Booking Pipeline** — Integrated date-picker, Razorpay payment gateway, and automated PDF receipt generation
- **Revenue Analytics** — Recharts-powered insights for occupancy rates and growth trends

### 🍽️ For Restaurants

- **QR-Powered Digital Menus** — One-click QR code generation for specific tables or general menus
- **Live Order Tracking** — Kitchen Display Mode with 15s auto-refresh and status-based Kanban boards
- **Order Management** — Full support for Dine-in, Room Service, and Takeaway workflows

### 🛡️ For Super Admins

- **Tenant Moderation** — Verify, suspend, or impersonate business accounts
- **Platform KPIs** — Monitor MRR, ARR, and total platform transaction volume in real time
- **Audit Logs** — Complete system-wide activity tracking for security and compliance

---

## 📁 Project Structure

```
hospitpro/
├── app/                  # Next.js App Router (Auth, Public, Dashboard, Admin)
├── components/           # UI Library (Shadcn-inspired, modular)
├── lib/                  # Server-side utilities (Prisma, Razorpay, Cloudinary)
├── hooks/                # Custom React hooks for state & data fetching
├── prisma/               # Database schemas & Seeding scripts
└── types/                # Global TypeScript interface definitions
```

---

## 🚦 Getting Started

### Prerequisites

- Node.js **18+**
- A **MongoDB** instance (local or Atlas)
- **Cloudinary** developer account
- **Razorpay** developer account

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/hospitpro.git
cd hospitpro
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Fill in your `.env` file with the required API keys:

```env
# Database
DATABASE_URL="mongodb+srv://..."

# NextAuth
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Razorpay
RAZORPAY_KEY_ID="..."
RAZORPAY_KEY_SECRET="..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Resend (Email)
RESEND_API_KEY="..."
```

### 3. Database Sync

```bash
npx prisma generate
npx prisma db push
npx prisma db seed    # Seeds Demo Hotel & Restaurant
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. 🎉

---

## 🔒 Reliability & Error Handling

| Mechanism | Description |
|---|---|
| ⚡ **Graceful Failovers** | `error.tsx` and `loading.tsx` at every route level — the platform never crashes |
| ✅ **Zod Validation** | Strict schema validation on every API request and form submission |
| 📶 **Offline Banner** | Real-time network status detection for on-site restaurant staff |

---

## 🗺️ Roadmap

- [ ] WhatsApp notification integration for booking confirmations
- [ ] Multi-language support (Hindi, Marathi, Tamil)
- [ ] AI-powered dynamic pricing for room management
- [ ] Mobile app (React Native) for business owners
- [ ] Loyalty & rewards system for customers

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a PR.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

## 👨‍💻 Developed By

**Madhava Creation**

**CEO & Lead Developer:** Durgesh Prajapati

*Empowering small businesses in India with next-generation digital tools.*

<br/>

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/your-username)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/your-profile)

<br/>

*⭐ Star this repo if HospitPro helped your business go digital!*

</div>
