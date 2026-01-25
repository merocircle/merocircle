# Creators Nepal - API Routes Documentation

> Generated on: January 25, 2026
> Total API Routes: 30

## Table of Contents

1. [API Structure Overview](#api-structure-overview)
2. [Authentication & User Management](#authentication--user-management)
3. [Posts Management](#posts-management)
4. [Creator Profiles](#creator-profiles)
5. [Social Features](#social-features)
6. [Notifications](#notifications)
7. [Dashboard & Feed](#dashboard--feed)
8. [Payment & Transactions](#payment--transactions)
9. [Community & Chat](#community--chat)
10. [Polls](#polls)
11. [File Upload](#file-upload)
12. [Frontend Hook Mapping](#frontend-hook-mapping)

---

## API Structure Overview

```
app/api/
├── chat/
│   ├── channel-unread-counts/route.ts    # GET - Unread counts per channel
│   └── unread-count/route.ts             # GET - Total unread count
├── community/
│   └── channels/
│       ├── route.ts                      # GET/POST - List/Create channels
│       └── [channelId]/
│           └── messages/route.ts         # GET/POST - Channel messages
├── creator/
│   ├── analytics/route.ts                # GET - Creator analytics
│   └── [id]/
│       ├── route.ts                      # GET - Creator profile details
│       ├── dashboard/route.ts            # GET - Creator dashboard stats
│       ├── onboarding/route.ts           # POST - Update onboarding status
│       └── posts/route.ts                # GET - Creator's posts
├── dashboard/
│   └── unified-feed/route.ts             # GET - Unified feed with ranking
├── earnings/route.ts                     # GET - Earnings summary
├── notifications/route.ts                # GET/PATCH - Notifications
├── payment/
│   ├── initiate/route.ts                 # POST - eSewa payment init
│   ├── verify/route.ts                   # GET - eSewa callback verify
│   ├── direct/route.ts                   # POST - Direct payment bypass
│   └── khalti/
│       ├── initiate/route.ts             # POST - Khalti payment init
│       └── verify/route.ts               # GET - Khalti callback verify
├── polls/
│   ├── [pollId]/route.ts                 # GET - Poll details
│   └── vote/route.ts                     # POST/DELETE - Vote on poll
├── posts/
│   ├── route.ts                          # GET/POST - List/Create posts
│   └── [id]/
│       ├── route.ts                      # GET/PUT/DELETE - Single post
│       ├── like/route.ts                 # POST/DELETE - Like post
│       └── comments/route.ts             # GET/POST - Post comments
├── profile/route.ts                      # PUT - Update user profile
├── social/
│   ├── discover/route.ts                 # GET - Trending/suggested creators
│   ├── like/route.ts                     # GET/POST - Like status/toggle
│   └── search/route.ts                   # GET - Search creators
├── supporter/
│   ├── creators/route.ts                 # GET - Supported creators list
│   └── history/route.ts                  # GET - Support transaction history
└── upload/route.ts                       # POST - File upload
```

---

## Authentication & User Management

### Profile Update
**`PUT /api/profile`**

Updates user profile information.

| Field | Type | Description |
|-------|------|-------------|
| display_name | string | User's display name |
| bio | string | User bio/description |
| category | string | Creator category |
| photo_url | string | Avatar URL |
| cover_image_url | string | Cover image URL |

**Frontend Usage:** `components/dashboard/sections/SettingsSection.tsx`

---

## Posts Management

### List/Create Posts
**`GET /api/posts`**

Retrieves public posts with pagination and filtering.

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Posts per page (default: 20) |
| creator_id | string | Filter by creator |

**`POST /api/posts`**

Creates a new post or poll.

| Field | Type | Description |
|-------|------|-------------|
| title | string | Post title |
| content | string | Post content |
| image_url | string? | Image attachment |
| media_url | string? | Video/media attachment |
| is_public | boolean | Public visibility |
| tier_required | string | Required tier (free/tier1/tier2/tier3) |
| post_type | string | Type: post/poll |

**Frontend Usage:** `hooks/useQueries.ts` - `usePublishPost()`

---

### Single Post Operations
**`GET /api/posts/[id]`**

Fetches single post with creator details, likes, and comments.

**`PUT /api/posts/[id]`**

Updates post content (owner only).

**`DELETE /api/posts/[id]`**

Deletes a post (owner only).

**Frontend Usage:** `hooks/usePosts.ts`

---

### Post Likes
**`POST /api/posts/[id]/like`**

Like a post.

**`DELETE /api/posts/[id]/like`**

Unlike a post.

**Frontend Usage:** `hooks/usePosts.ts` - `likePost()`

---

### Post Comments
**`GET /api/posts/[id]/comments`**

Fetches comments with pagination.

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Comments per page |
| offset | number | Pagination offset |

**`POST /api/posts/[id]/comments`**

Adds a new comment.

| Field | Type | Description |
|-------|------|-------------|
| content | string | Comment text |
| parent_comment_id | string? | For nested replies |

**Frontend Usage:** `hooks/useQueries.ts` - `useAddComment()`

---

## Creator Profiles

### Creator Details
**`GET /api/creator/[id]`**

Fetches complete creator profile including:
- Creator details (bio, avatar, stats)
- Subscription tiers
- Payment methods
- Recent posts
- Supporter status

**Frontend Usage:** `hooks/useCreatorDetails.ts` - `useCreatorDetails()`

---

### Creator Posts
**`GET /api/creator/[id]/posts`**

Fetches creator's posts via RPC function.

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Posts per page |
| offset | number | Pagination offset |

**Frontend Usage:** `hooks/useSocial.ts` - `useCreatorProfile()`

---

### Creator Dashboard
**`GET /api/creator/[id]/dashboard`**

Returns dashboard stats:
- Monthly earnings
- Total supporters
- Post counts
- Recent activity
- Top supporters

**Frontend Usage:** `hooks/useQueries.ts` - `useCreatorDashboardData()`

---

### Creator Analytics
**`GET /api/creator/analytics`**

Detailed analytics including:
- 6-month earnings trend
- 30-day supporter growth
- Engagement metrics
- Top supporters list

**Frontend Usage:** `hooks/useQueries.ts` - `useCreatorAnalytics()`

---

### Onboarding Status
**`POST /api/creator/[id]/onboarding`**

Updates creator onboarding completion status.

| Field | Type | Description |
|-------|------|-------------|
| completed | boolean | Onboarding completed |

**Frontend Usage:** `components/dashboard/OnboardingBanner.tsx`

---

## Social Features

### Discovery Feed
**`GET /api/social/discover`**

Returns discovery data:
- Trending creators
- Suggested creators
- Recent public posts

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Items per section |

**Frontend Usage:** `hooks/useSocial.ts` - `useDiscoveryFeed()`

---

### Creator Search
**`GET /api/social/search`**

Searches creators by name/bio using RPC function.

| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (min 2 chars) |
| limit | number | Max results |

**Frontend Usage:** `hooks/useSocial.ts` - `useCreatorSearch()`

---

### Like Toggle
**`GET /api/social/like`**

Checks like status for a post.

**`POST /api/social/like`**

Toggles like on a post.

| Field | Type | Description |
|-------|------|-------------|
| postId | string | Post ID |
| action | string | 'like' or 'unlike' |

**Frontend Usage:** `hooks/useQueries.ts` - `useLikePost()`

---

## Notifications

### Notifications
**`GET /api/notifications`**

Fetches user notifications.

| Parameter | Type | Description |
|-----------|------|-------------|
| type | string? | Filter by type |
| unread_only | boolean? | Only unread |
| limit | number | Max results |

**`PATCH /api/notifications`**

Marks notifications as read.

| Field | Type | Description |
|-------|------|-------------|
| notificationIds | string[] | IDs to mark read |
| markAllRead | boolean | Mark all as read |

**Frontend Usage:** `hooks/useQueries.ts` - `useNotificationsData()`, `useMarkNotificationRead()`, `useMarkAllNotificationsRead()`

---

## Dashboard & Feed

### Unified Feed
**`GET /api/dashboard/unified-feed`**

Returns personalized feed with:
- Posts ranked by engagement + time decay
- Creator suggestions
- Support stats

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number |

**Frontend Usage:** `hooks/useQueries.ts` - `useUnifiedDashboard()`

---

## Payment & Transactions

### eSewa Payment Initiation
**`POST /api/payment/initiate`**

Initiates eSewa payment.

| Field | Type | Description |
|-------|------|-------------|
| amount | number | Amount in NPR |
| creatorId | string | Creator to support |
| supporterId | string | Supporter user ID |
| supporterMessage | string? | Optional message |
| tier_level | number | Support tier |

**Frontend Usage:** `components/dashboard/sections/CreatorProfileSection.tsx`

---

### eSewa Payment Verification
**`GET /api/payment/verify`**

Callback endpoint for eSewa payment verification.

| Parameter | Type | Description |
|-----------|------|-------------|
| transaction_uuid | string | Transaction ID |
| total_amount | string | Verified amount |

**Note:** Called externally by eSewa gateway

---

### Khalti Payment Initiation
**`POST /api/payment/khalti/initiate`**

Initiates Khalti payment.

| Field | Type | Description |
|-------|------|-------------|
| amount | number | Amount in NPR |
| creatorId | string | Creator to support |
| supporterId | string | Supporter user ID |
| supporterMessage | string? | Optional message |
| tier_level | number | Support tier |

**Frontend Usage:** `components/dashboard/sections/CreatorProfileSection.tsx`

---

### Khalti Payment Verification
**`GET /api/payment/khalti/verify`**

Callback endpoint for Khalti payment verification.

| Parameter | Type | Description |
|-----------|------|-------------|
| pidx | string | Khalti payment ID |
| transaction_id | string | Transaction reference |
| amount | string | Amount in paisa |

**Note:** Called externally by Khalti gateway

---

### Direct Payment
**`POST /api/payment/direct`**

Bypass payment gateway for testing/admin.

| Field | Type | Description |
|-------|------|-------------|
| amount | number | Amount in NPR |
| creatorId | string | Creator ID |
| supporterId | string | Supporter ID |
| supporterMessage | string? | Message |
| tier_level | number | Tier level |

**Frontend Usage:** `components/payment/PaymentGatewaySelector.tsx`

---

### Earnings
**`GET /api/earnings`**

Returns earnings summary.

| Parameter | Type | Description |
|-----------|------|-------------|
| period | string | Time period (e.g., '30d') |

**Response:**
- Total earnings
- Current period earnings
- Unique supporters
- Recent transactions

**Frontend Usage:** `hooks/useDashboard.ts` - `useCreatorDashboard()`

---

### Supported Creators
**`GET /api/supporter/creators`**

Lists creators the user has supported.

**Frontend Usage:** `hooks/useSupporterDashboard.ts` - `useSupportedCreators()`

---

### Support History
**`GET /api/supporter/history`**

Fetches support transaction history.

| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Max transactions |

**Frontend Usage:** `hooks/useSupporterDashboard.ts` - `useSupportHistory()`

---

## Community & Chat

### Channels
**`GET /api/community/channels`**

Lists user's community channels.

**`POST /api/community/channels`**

Creates a new channel.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Channel name |
| description | string? | Description |
| category | string? | Category |
| channel_type | string | Type |

**Frontend Usage:** `hooks/useQueries.ts` - `useCommunityChannels()`

---

### Channel Messages
**`GET /api/community/channels/[channelId]/messages`**

Fetches channel messages with pagination.

**`POST /api/community/channels/[channelId]/messages`**

Sends a message to the channel.

| Field | Type | Description |
|-------|------|-------------|
| content | string | Message content |

**Frontend Usage:** `hooks/useQueries.ts` - `useSendMessage()`, `hooks/useRealtimeChat.ts`

---

### Unread Counts
**`GET /api/chat/unread-count`**

Total unread messages across all channels.

**`GET /api/chat/channel-unread-counts`**

Unread count per channel.

| Parameter | Type | Description |
|-----------|------|-------------|
| lastViewed | string | JSON map of channel:timestamp |

**Frontend Usage:** `hooks/useUnreadChatCount.ts`, `hooks/useChannelUnreadCounts.ts`

---

## Polls

### Poll Details
**`GET /api/polls/[pollId]`**

Fetches poll with options and vote statistics.

**Frontend Usage:** `components/posts/PollCard.tsx`

---

### Poll Voting
**`POST /api/polls/vote`**

Submit a vote on a poll option.

| Field | Type | Description |
|-------|------|-------------|
| pollId | string | Poll ID |
| optionId | string | Selected option ID |

**`DELETE /api/polls/vote`**

Remove a vote.

| Parameter | Type | Description |
|-----------|------|-------------|
| pollId | string | Poll ID |
| optionId | string | Option to unvote |

**Frontend Usage:** `components/posts/PollCard.tsx`

---

## File Upload

### Upload
**`POST /api/upload`**

Uploads media files to Supabase storage.

| Field | Type | Description |
|-------|------|-------------|
| file | File | File to upload (multipart) |
| folder | string | Storage folder (default: posts) |

**Limits:**
- Rate limit: 10 uploads per minute
- Supported: images, videos

**Frontend Usage:** `components/dashboard/sections/SettingsSection.tsx`

---

## Frontend Hook Mapping

| Hook | File | API Endpoint(s) |
|------|------|-----------------|
| `useUnifiedDashboard` | hooks/useQueries.ts | `/api/dashboard/unified-feed` |
| `useCreatorAnalytics` | hooks/useQueries.ts | `/api/creator/analytics` |
| `useCreatorDashboardData` | hooks/useQueries.ts | `/api/creator/[id]/dashboard` |
| `useNotificationsData` | hooks/useQueries.ts | `/api/notifications` |
| `useCommunityChannels` | hooks/useQueries.ts | `/api/community/channels` |
| `usePublishPost` | hooks/useQueries.ts | `/api/posts` |
| `useSendMessage` | hooks/useQueries.ts | `/api/community/channels/[id]/messages` |
| `useMarkNotificationRead` | hooks/useQueries.ts | `/api/notifications` |
| `useMarkAllNotificationsRead` | hooks/useQueries.ts | `/api/notifications` |
| `useLikePost` | hooks/useQueries.ts | `/api/social/like` |
| `useAddComment` | hooks/useQueries.ts | `/api/posts/[id]/comments` |
| `usePrefetchCreator` | hooks/useQueries.ts | `/api/creator/[id]` |
| `usePrefetchFeedPage` | hooks/useQueries.ts | `/api/dashboard/unified-feed` |
| `usePosts` | hooks/usePosts.ts | `/api/posts`, `/api/social/like` |
| `usePost` | hooks/usePosts.ts | `/api/posts/[id]` |
| `useDiscoveryFeed` | hooks/useSocial.ts | `/api/social/discover` |
| `useCreatorSearch` | hooks/useSocial.ts | `/api/social/search` |
| `usePostLike` | hooks/useSocial.ts | `/api/social/like` |
| `useCreatorProfile` | hooks/useSocial.ts | `/api/creator/[id]`, `/api/creator/[id]/posts` |
| `useCreatorDashboard` | hooks/useDashboard.ts | `/api/earnings`, `/api/creator/[id]/dashboard` |
| `useSupporterDashboard` | hooks/useDashboard.ts | `/api/supporter/creators`, `/api/supporter/history` |
| `useNotifications` | hooks/useNotifications.ts | `/api/notifications` |
| `useSupportedCreators` | hooks/useSupporterDashboard.ts | `/api/supporter/creators` |
| `useSupportHistory` | hooks/useSupporterDashboard.ts | `/api/supporter/history` |
| `useCreatorDetails` | hooks/useCreatorDetails.ts | `/api/creator/[id]` |
| `useRealtimeChat` | hooks/useRealtimeChat.ts | `/api/community/channels/[id]/messages` |
| `useUnreadChatCount` | hooks/useUnreadChatCount.ts | `/api/chat/unread-count` |
| `useChannelUnreadCounts` | hooks/useChannelUnreadCounts.ts | `/api/chat/channel-unread-counts` |

---

## Database Tables

The API routes interact with the following Supabase tables:

| Table | Description |
|-------|-------------|
| `users` | User accounts and basic profile info |
| `creator_profiles` | Creator-specific information and stats |
| `posts` | Content/posts created by creators |
| `post_likes` | Like relationships |
| `post_comments` | Comments on posts |
| `supporter_transactions` | Payment and support records |
| `supporters` | Active supporter relationships |
| `subscription_tiers` | Creator subscription tier definitions |
| `creator_payment_methods` | Payment gateway configurations |
| `notifications` | User notifications |
| `polls` | Poll posts |
| `poll_options` | Poll answer options |
| `poll_votes` | Poll voting records |
| `channels` | Community chat channels |
| `channel_members` | Channel membership |
| `channel_messages` | Chat messages |
| `user_activities` | Activity logging |

---

## Summary Statistics

- **Total API Routes:** 30
- **HTTP Methods:** GET (19), POST (13), PUT (2), PATCH (1), DELETE (3)
- **External Callbacks:** 2 (eSewa verify, Khalti verify)
- **Database Tables:** 17

---

## Removed Routes (Optimization)

The following routes were removed as they were unused or redundant:

| Route | Reason |
|-------|--------|
| `/api/auth/check` | Not used - auth handled by Supabase context |
| `/api/dashboard/feed` | Replaced by `/api/dashboard/unified-feed` |
| `/api/creator/[id]/tiers` | Redundant - tiers included in `/api/creator/[id]` |

---

## Payment Flow - Supporter Count Update

All payment completion routes update the `supporters_count` in `creator_profiles`:

1. **Direct Payment** (`/api/payment/direct`) - Updates count after transaction creation
2. **eSewa Verify** (`/api/payment/verify`) - Updates count after payment verification
3. **Khalti Verify** (`/api/payment/khalti/verify`) - Updates count after payment verification

The count is calculated by counting unique active supporters from the `supporters` table:

```sql
SELECT COUNT(DISTINCT supporter_id)
FROM supporters
WHERE creator_id = ? AND is_active = true
```
