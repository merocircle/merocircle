# Creators Nepal 🇳🇵

Platform for supporting Nepali creators with local payment integration.

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)

## Features

- Creator profiles with content management
- eSewa/Khalti payment integration
- Social features (follow, like, comment)
- Analytics dashboard
- Dark mode support

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

See `docs/QUICK_START.md` for detailed setup guide.

**eSewa Test Mode**: Enabled by default. Payments auto-complete for development.

## Tech Stack

- Next.js 15.3 with App Router
- TypeScript
- Supabase (Auth + Database)
- Tailwind CSS 4.0
- Radix UI + Framer Motion

## Database

Tables: `users`, `creator_profiles`, `supporter_transactions`, `follows`, `posts`, `post_likes`, `post_comments`

Functions: `get_discovery_feed()`, `search_creators()`, `get_creator_posts()`

## Payment Integration

**eSewa**: See `docs/ESEWA_SETUP.md`
- Test mode available for development
- Requires merchant registration for production

## Deployment

Works on Vercel, Netlify, Railway, or any Next.js hosting.

Set environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_BASE_URL`
- `ESEWA_TEST_MODE=true` (for development)

---

Made with ❤️ for Nepal's creator community
