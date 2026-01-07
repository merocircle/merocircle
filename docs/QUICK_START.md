# Quick Start Guide

## Setup (3 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
ESEWA_TEST_MODE=true  # Keep this for development
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ✅ What Works Out of the Box

### With Test Mode Enabled:
- ✅ User signup/login
- ✅ Creator profiles
- ✅ Post creation with photo upload
- ✅ Social features (follow, like, comment)
- ✅ Discovery and search
- ✅ **Payments auto-complete** (no eSewa required)
- ✅ Dashboard analytics

### Supabase Storage:
- ✅ `media` bucket created
- ✅ Policies configured
- ✅ Ready for uploads

## 🎨 Test the Features

### 1. Create Account
- Go to `/signup/creator`
- Sign up with Google or email
- Fill in bio and category

### 2. Upload Photo & Create Post
- Go to Creator Dashboard
- Click "Photo" button
- Upload image (max 5MB)
- Add title and content
- Click "Publish"

### 3. Test Payment (Auto-Completes)
- Visit another creator's profile
- Click "Support"
- Enter amount
- Click "Pay with eSewa"
- **Payment completes instantly** (test mode)

### 4. Social Features
- Follow creators
- Like posts
- Add comments
- Search for creators

## 🚀 Everything Just Works!

No complicated setup, no eSewa registration needed for development. Just add your Supabase credentials and you're ready to go!

---

**Next Steps**: See `docs/PRODUCTION_CHECKLIST.md` when ready to deploy.

