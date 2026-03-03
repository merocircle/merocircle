# MeroCircle

A creator support platform built for Nepal's creator community. MeroCircle connects creators with their supporters through exclusive content, real-time chat, and local payment integration.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![Stream Chat](https://img.shields.io/badge/Stream_Chat-Latest-blue)](https://getstream.io/)

---

## What is MeroCircle?

MeroCircle is a membership and content platform where Nepali creators can share exclusive posts, polls, and media with their supporters. Supporters join a creator's "circle" through tiered membership plans and gain access to exclusive content, community chat channels, and direct messaging.

**The problem it solves:** Nepali creators lack a local platform with Nepali payment gateways (eSewa, Khalti) to monetize their content and connect directly with their audience without algorithmic interference.

---

## Architecture

```
Frontend (Next.js 15 App Router)
    |
    |-- React + Tailwind CSS + Radix UI
    |-- Stream Chat React SDK (real-time messaging)
    |-- React Query (data fetching + caching)
    |-- next-themes (dark/light/system theme)
    |
    +-- API Routes (Next.js Route Handlers)
            |
            |-- Supabase (PostgreSQL database + Auth + Storage)
            |-- Stream Chat API (channels, messages, DMs)
            |-- SMTP Email (nodemailer + React Email templates)
            |-- eSewa Payment Gateway
            |-- Khalti Payment Gateway
```

### Data Flow: Post Creation

```
Creator -> /create-post page
    -> POST /api/posts (validates, creates post in Supabase)
    -> post-publishing-engine (handles polls, images, activity logging)
    -> sendBulkPostNotifications() (emails supporters in batches)
    -> React Query cache invalidation (instant UI update)
```

### Data Flow: Payment / Subscription

```
Supporter -> Creator profile -> Select tier -> Choose gateway (eSewa/Khalti)
    -> Payment gateway redirect -> User completes payment
    -> Callback to /api/payment/verify (verifies signature)
    -> Creates supporter_transaction in Supabase
    -> Grants access to exclusive content
    -> Sends confirmation emails to both parties
```

---

## Features

### For Creators
- **Creator Studio** with tabbed dashboard (Posts, Analytics, Supporters, Inbox)
- **Post creation** with polls, image galleries, video embeds, and rich text
- **Analytics** including earnings charts, supporter growth, engagement metrics
- **Tiered membership** (up to 3 tiers with custom pricing in NPR)
- **Email notifications** toggle per post
- **Profile customization** with cover photo, bio, social links, vanity URL
- **Community chat channels** via Stream Chat

### For Supporters
- **Discover creators** through the Explore tab
- **Join circles** through tiered membership plans
- **Access exclusive content** (posts, polls, media)
- **Real-time chat** with creators and other supporters
- **Notification system** for new posts, mentions, and activity
- **Timeline feed** with content from followed creators

### Platform Features
- **Dark/Light/System theme** support
- **Responsive design** (mobile-first)
- **SEO optimized** with OpenGraph images, structured data, sitemap
- **Real-time notifications** with unread badges
- **In-app feedback** mechanism (subliminal single-question prompts)
- **Email templates** (welcome, payment, notifications, subscription reminders)
- **Admin dashboard** for platform management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5 (App Router) |
| Language | TypeScript 5.0 |
| Styling | Tailwind CSS 4.0 |
| UI Components | Radix UI, shadcn/ui |
| Animations | Framer Motion |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL) |
| Auth | NextAuth.js (Google OAuth) |
| File Storage | Supabase Storage |
| Real-time Chat | Stream Chat SDK |
| Data Fetching | TanStack React Query |
| Email | Nodemailer + React Email |
| Charts | Recharts |
| Theme | next-themes |
| Payments | eSewa, Khalti |

---

## Database Schema

### Core Tables

- **`users`** - User accounts (id, email, display_name, photo_url, role)
- **`creator_profiles`** - Creator-specific data (bio, category, vanity_username, social_links, tiers, earnings)
- **`posts`** - All content (title, content, image_urls, is_public, tier_required, post_type, views_count)
- **`post_likes`** - Like records (user_id, post_id)
- **`post_comments`** - Threaded comments (user_id, post_id, content, parent_comment_id)
- **`post_views`** - View tracking (post_id, user_id, viewed_at)
- **`polls`** - Poll metadata (linked to posts)
- **`poll_options`** - Poll answer options
- **`poll_votes`** - User votes on polls
- **`supporter_transactions`** - Payment records (amount, gateway, status)
- **`follows`** - Follow relationships
- **`notifications`** - In-app notifications (type, actor_id, target_id)
- **`feedback`** - User feedback (question, answer, user_id, is_creator)
- **`user_activities`** - Activity log for analytics

### Key Database Functions

- `get_discovery_feed()` - Fetches discovery feed with ranking
- `search_creators()` - Full-text creator search
- `get_creator_posts()` - Fetches creator posts with access control
- `increment_post_views()` - Atomically increments post view count

---

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (free tier works)
- Stream Chat account (free tier works)
- Google OAuth credentials (for authentication)

### Installation

```bash
# Clone the repository
git clone https://github.com/merocircle/merocircle.git
cd merocircle

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=         # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key (server-side only)

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=                  # Random secret (openssl rand -base64 32)
GOOGLE_CLIENT_ID=                 # Google OAuth client ID
GOOGLE_CLIENT_SECRET=             # Google OAuth client secret

# Stream Chat
NEXT_PUBLIC_STREAM_API_KEY=       # Stream Chat API key
STREAM_API_SECRET=                # Stream Chat API secret (server-side only)

# Email (SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=                        # SMTP username
SMTP_PASSWORD=                    # SMTP password
SMTP_FROM_EMAIL=                  # From email address
UNSUBSCRIBE_SECRET=               # HMAC secret for unsubscribe tokens

# Payment Gateways
ESEWA_MERCHANT_CODE=              # eSewa merchant code
ESEWA_SECRET_KEY=                 # eSewa secret key
ESEWA_TEST_MODE=true              # Set to false for production
KHALTI_SECRET_KEY=                # Khalti secret key
NEXT_PUBLIC_KHALTI_PUBLIC_KEY=    # Khalti public key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Payment Testing

### eSewa (Test Mode)

eSewa works immediately in test mode:

- **ID:** `9806800001`
- **Password:** `Nepal@123`
- **MPIN:** `1122`

### Khalti (Test Mode)

Register at https://test-admin.khalti.com (free, takes 5 minutes):

- Get test API keys from the Khalti dashboard
- **Test Mobile:** `9800000000`
- **Test MPIN:** `1111`
- **Test OTP:** `987654`

See `docs/QUICK_TEST.md` for detailed testing instructions.

---

## Testing

Unit, integration, and E2E tests run on every push and PR. See **[docs/TESTING.md](docs/TESTING.md)** for full details.

| Command | Description |
|---------|-------------|
| `npm test` | Run unit + integration tests (Vitest) once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run Vitest with coverage report |
| `npm run test:e2e` | Run E2E tests (Playwright); app must be at http://localhost:3000 |

---

## Project Structure

```
app/
  layout.tsx              # Root layout (metadata, fonts, providers)
  page.tsx                # Landing page
  auth/                   # Authentication pages
  home/                   # Main feed (post-login)
  chat/                   # Chat interface
  explore/                # Creator discovery
  notifications/          # Notification center
  creator-studio/         # Creator dashboard
  creator/[slug]/         # Public creator profiles
  create-post/            # Post creation page
  settings/               # User settings
  api/                    # API route handlers
    posts/                # Post CRUD + likes + comments + views
    creator/              # Creator profile + analytics + dashboard
    notifications/        # Notification management
    feedback/             # User feedback
    payment/              # Payment verification
    upload/               # File upload
    auth/                 # NextAuth handlers

components/
  dashboard/sections/     # Dashboard section components
  posts/                  # Post cards, comments, polls
  stream-chat/            # Chat UI components
  navigation/             # Sidebar, nav icons
  landing/                # Landing page sections
  feedback/               # Feedback sheet component
  ui/                     # Shared UI primitives (shadcn/ui)

hooks/                    # Custom React hooks
  useQueries.ts           # React Query mutations + queries
  useRealtimeFeed.ts      # Real-time feed with timeline grouping
  useCreatorDetails.ts    # Creator profile data

lib/                      # Utilities and engines
  auth.ts                 # NextAuth configuration
  email.ts                # Email sending functions
  post-publishing-engine.ts # Post creation logic
  supabase/               # Supabase client configuration
  types.ts                # TypeScript type definitions

emails/                   # React Email templates
contexts/                 # React context providers
```

---

## Deployment

Works on Vercel, Netlify, Railway, or any Next.js hosting platform.

1. Push to GitHub
2. Connect to Vercel (recommended)
3. Set all environment variables in the deployment dashboard
4. Deploy

For production:
- Set `ESEWA_TEST_MODE=false`
- Use production Khalti keys
- Ensure `NEXT_PUBLIC_APP_URL` points to your domain
- Configure custom domain in Supabase and Stream Chat dashboards

---

## Contributing

MeroCircle is currently in beta. We welcome feedback through the in-app feedback button or via email at **team@merocircle.app**.

---

Made with care for Nepal's creator community.
