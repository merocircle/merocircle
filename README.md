# MeroCircle 🇳🇵

Platform for supporting Nepali creators with local payment integration.

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)

## Features

- Creator profiles with content management
- **Payment Gateways** (eSewa & Khalti)
- Payment gateway selector
- Social features (follow, like, comment)
- Analytics dashboard
- Dark mode support

## Setup

```bash
npm install
cp .env.example .env.local
# Add Supabase credentials to .env.local
npm run dev
```

## Test Payments

```bash
# 1. Start ngrok
ngrok http 3000

# 2. Update NEXT_PUBLIC_APP_URL in .env.local with ngrok URL

# 3. Test eSewa
# ID: 9806800001, Password: Nepal@123, MPIN: 1122
```

See `docs/QUICK_TEST.md` for Khalti setup.

## Tech Stack

- Next.js 15.3 with App Router
- TypeScript
- Supabase (Auth + Database)
- Tailwind CSS 4.0
- Radix UI + Framer Motion

## Database

Tables: `users`, `creator_profiles`, `supporter_transactions`, `follows`, `posts`, `post_likes`, `post_comments`

Functions: `get_discovery_feed()`, `search_creators()`, `get_creator_posts()`

## Payment Gateways

**eSewa**: Test immediately
- ID: `9806800001` / Password: `Nepal@123` / MPIN: `1122`

**Khalti**: Register at https://test-admin.khalti.com (FREE, 5 min)
- Get test keys from dashboard
- Mobile: `9800000000` / MPIN: `1111` / OTP: `987654`

**Testing**: See `docs/QUICK_TEST.md`

## Deployment

Works on Vercel, Netlify, Railway, or any Next.js hosting.

Set environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BASE_URL`
- `ESEWA_TEST_MODE=true` (for development)

---

Made with ❤️ for Nepal's creator community
