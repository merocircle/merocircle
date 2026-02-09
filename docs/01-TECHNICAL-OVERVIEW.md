# MeroCircle - Technical Overview

## Project Description

MeroCircle is a comprehensive creator economy platform designed specifically for Nepali creators. It enables creators to monetize their content through supporter subscriptions, while providing supporters with exclusive content, community access, and direct engagement opportunities.

## Core Purpose

- **For Creators**: Monetize content, build a community, track analytics, and manage supporter relationships
- **For Supporters**: Support favorite creators, access exclusive content, participate in polls, and engage in community discussions

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.9 (App Router)
- **Language**: TypeScript 5.0
- **UI Library**: React 19.0.0
- **Styling**: Tailwind CSS 4.0
- **Component Library**: Radix UI (headless components)
- **Animations**: Framer Motion 12.16.0
- **State Management**: 
  - React Query (TanStack Query) 5.90.19 for server state
  - React Context API for global state
- **Icons**: Lucide React, React Icons

### Backend
- **Runtime**: Node.js (via Next.js API Routes)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **File Storage**: Supabase Storage

### Third-Party Services
- **Chat**: Stream Chat (real-time messaging)
- **Video**: Stream Video SDK (for future video features)
- **Email**: SendGrid (transactional emails)
- **Payment Gateways**:
  - eSewa (Nepal's leading payment gateway)
  - Khalti (Nepal's digital wallet)

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint 9.28.0
- **Type Checking**: TypeScript strict mode
- **Build Tool**: Next.js (with Turbopack support)

## Project Structure

```
creators-nepal/
├── app/                    # Next.js App Router
│   ├── api/                # API routes (backend)
│   ├── auth/               # Authentication pages
│   ├── creator-studio/     # Creator dashboard
│   ├── dashboard/          # User dashboard
│   ├── [username]/         # Public creator profiles
│   └── ...                 # Other pages
├── components/             # React components
│   ├── atoms/             # Basic UI components
│   ├── molecules/         # Composite components
│   ├── organisms/         # Complex components
│   ├── dashboard/         # Dashboard-specific components
│   └── ...                # Other component categories
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and configs
├── supabase/              # Database migrations
└── public/                # Static assets
```

## Key Features

### 1. Authentication & User Management
- Google OAuth authentication via Supabase
- Role-based access (user/creator)
- User profile management
- Creator profile creation and onboarding

### 2. Creator Features
- **Content Management**: Create posts, polls, upload images
- **Analytics Dashboard**: Track earnings, supporters, engagement
- **Creator Studio**: Comprehensive dashboard for content management
- **Subscription Tiers**: Create and manage supporter tiers
- **Payment Methods**: Configure eSewa and Khalti payment methods

### 3. Supporter Features
- **Support Creators**: One-time and recurring payments
- **Exclusive Content**: Access tier-based content
- **Community Access**: Join creator channels via Stream Chat
- **Notifications**: Real-time notifications for new posts, comments, likes

### 4. Social Features
- **Feed**: Unified feed showing posts from followed creators
- **Explore**: Discover new creators
- **Interactions**: Like, comment, share posts
- **Follow System**: Follow creators to see their content

### 5. Payment Integration
- **eSewa Integration**: Full payment flow with signature verification
- **Khalti Integration**: Digital wallet payments
- **Transaction Management**: Track all supporter transactions
- **Payment Verification**: Secure server-side verification

### 6. Communication
- **Stream Chat**: Real-time messaging between creators and supporters
- **Channels**: Creator-managed community channels
- **Email Notifications**: Automated emails for new posts

### 7. Content Management
- **Posts**: Text and image posts
- **Polls**: Interactive polls with multiple options
- **Media Upload**: Image upload to Supabase Storage
- **Content Visibility**: Public or tier-restricted content

## Database Schema

### Core Tables
- `users`: User accounts and profiles
- `creator_profiles`: Extended creator information
- `posts`: User-generated content
- `polls`: Poll questions and options
- `post_likes`: Post likes tracking
- `post_comments`: Comments on posts
- `supporter_transactions`: Payment transactions
- `supporters`: Supporter-creator relationships
- `subscription_tiers`: Creator subscription tiers
- `notifications`: User notifications
- `follows`: User follow relationships

### Database Functions
- `get_discovery_feed()`: Generate personalized feed
- `search_creators()`: Search creator profiles
- `get_creator_transaction_stats()`: Calculate earnings

## Security Features

- **Authentication**: Supabase Auth with JWT tokens
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries via Supabase
- **XSS Protection**: Content sanitization
- **CORS**: Configured for production domains

## Performance Optimizations

- **Code Splitting**: Dynamic imports for heavy components
- **Image Optimization**: Next.js Image component
- **Caching**: React Query caching strategies
- **Lazy Loading**: Component lazy loading
- **Virtualization**: React Window for long lists
- **Database Indexing**: Optimized database queries

## Development Workflow

1. **Local Development**: `npm run dev`
2. **Build**: `npm run build`
3. **Production**: `npm start`
4. **Linting**: `npm run lint`

## Documentation

### Complete Documentation Set

1. **[Technical Overview](01-TECHNICAL-OVERVIEW.md)** (this document)
   - Technology stack
   - Project structure
   - Key features
   - Development workflow

2. **[Architecture Documentation](02-ARCHITECTURE.md)**
   - System architecture
   - Unified engines
   - Data flow diagrams
   - Integration patterns

3. **[Third-Party Integrations](03-THIRD-PARTY-INTEGRATIONS.md)**
   - Payment gateways (eSewa, Khalti, Dodo)
   - Stream Chat integration
   - Email service (Nodemailer)
   - Supabase setup
   - Environment variables

4. **[Database Schema](07-DATABASE-SCHEMA.md)**
   - Complete schema documentation
   - Tables and relationships
   - Indexes and constraints
   - Migration history

5. **[Subscription System](SUBSCRIPTION-SYSTEM.md)** ⭐ NEW
   - Complete subscription lifecycle
   - Tier changes (upgrades, downgrades, renewals)
   - Expiry management for eSewa/Khalti
   - User interface and APIs
   - Testing and troubleshooting

6. **[Dodo Payments Integration](DODO-PAYMENTS-INTEGRATION.md)**
   - Visa/Mastercard payment setup
   - Checkout sessions and webhooks
   - Exchange rate conversion (NPR to USD)
   - Integration with unified engines

## Environment Variables

See [`docs/03-THIRD-PARTY-INTEGRATIONS.md`](03-THIRD-PARTY-INTEGRATIONS.md) for complete environment variable documentation.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- Progressive Web App (PWA) ready

## License

Private - All rights reserved

---

**Last Updated**: February 2026
**Version**: 0.2.0
