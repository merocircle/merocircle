# Database Schema Documentation

Complete reference for the MeroCircle PostgreSQL database schema hosted on Supabase.

## Table of Contents

1. [Overview](#overview)
2. [Core Tables](#core-tables)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [Triggers & Functions](#triggers--functions)
6. [Database Functions](#database-functions)
7. [Row Level Security (RLS)](#row-level-security-rls)
8. [Performance Optimizations](#performance-optimizations)

---

## Overview

The MeroCircle database uses **PostgreSQL** hosted on **Supabase**. The schema is designed to support:

- User authentication and profiles
- Creator profiles and monetization
- Content management (posts, polls)
- Payment processing
- Social interactions (likes, comments)
- Notifications
- Community channels
- Subscription tiers

### Database Features

- **UUID Primary Keys**: All tables use UUID for primary keys
- **Timestamps**: Automatic `created_at` and `updated_at` tracking
- **Soft Deletes**: Some tables use `deleted_at` for soft deletion
- **JSONB**: Flexible JSON storage for metadata
- **Row Level Security**: Enabled on sensitive tables
- **Triggers**: Automatic count updates and notifications

---

## Core Tables

### `users`

Base user accounts table. All users (both regular users and creators) are stored here.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | User UUID (matches Supabase Auth) |
| `email` | TEXT | NOT NULL | User email address |
| `display_name` | TEXT | NOT NULL | Display name |
| `photo_url` | TEXT | NULLABLE | Profile photo URL |
| `role` | TEXT | NOT NULL, CHECK | User role: `'user'` or `'creator'` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Index on `email` (unique)
- Index on `role`

**Relationships**:
- One-to-one with `creator_profiles` (via `user_id`)
- One-to-many with `posts` (via `creator_id`)
- One-to-many with `supporter_transactions` (as `supporter_id` or `creator_id`)

---

### `creator_profiles`

Extended profile information for creators. Created when a user's role changes to `'creator'`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Profile UUID |
| `user_id` | UUID | NOT NULL, UNIQUE, FK → users.id | Reference to users table |
| `bio` | TEXT | NULLABLE | Creator biography |
| `category` | TEXT | NULLABLE | Creator category (e.g., "Music", "Art") |
| `is_verified` | BOOLEAN | NOT NULL, DEFAULT false | Verification badge status |
| `total_earnings` | NUMERIC(10,2) | NOT NULL, DEFAULT 0 | Total earnings from supporters |
| `supporters_count` | INTEGER | NOT NULL, DEFAULT 0 | Number of unique active supporters |
| `posts_count` | INTEGER | NOT NULL, DEFAULT 0 | Number of posts created |
| `likes_count` | INTEGER | NOT NULL, DEFAULT 0 | Total likes received |
| `social_links` | JSONB | DEFAULT '{}' | Social media links (YouTube, Instagram, etc.) |
| `onboarding_completed` | BOOLEAN | NOT NULL, DEFAULT false | Onboarding completion status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Profile creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `user_id`
- Index on `category`
- Index on `is_verified`
- Index on `supporters_count` (for sorting)

**Triggers**:
- Auto-creates default subscription tiers when profile is created
- Auto-creates default community channels when profile is created

**Notes**:
- `supporters_count` is denormalized and updated via trigger
- `posts_count` and `likes_count` are denormalized for performance

---

### `posts`

User-generated content posts. Can be regular posts or polls.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Post UUID |
| `creator_id` | UUID | NOT NULL, FK → users.id | Creator who posted |
| `title` | TEXT | NOT NULL | Post title |
| `content` | TEXT | NOT NULL | Post content/text |
| `image_url` | TEXT | NULLABLE | Primary image URL (legacy) |
| `image_urls` | TEXT[] | NULLABLE | Array of image URLs |
| `is_public` | BOOLEAN | NOT NULL, DEFAULT true | Public visibility |
| `tier_required` | TEXT | NOT NULL, DEFAULT 'free' | Minimum tier: `'free'`, `'1'`, `'2'`, `'3'` |
| `post_type` | TEXT | NOT NULL, DEFAULT 'post' | Type: `'post'` or `'poll'` |
| `likes_count` | INTEGER | NOT NULL, DEFAULT 0 | Denormalized likes count |
| `comments_count` | INTEGER | NOT NULL, DEFAULT 0 | Denormalized comments count |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Post creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete timestamp |

**Indexes**:
- Primary key on `id`
- Index on `creator_id`
- Composite index on `(creator_id, is_public, created_at DESC)` for feed queries
- Composite index on `(created_at DESC, likes_count DESC, comments_count DESC)` for engagement sorting
- Index on `post_type`
- Index on `tier_required`

**Relationships**:
- Many-to-one with `users` (via `creator_id`)
- One-to-one with `polls` (if `post_type = 'poll'`)
- One-to-many with `post_likes`
- One-to-many with `post_comments`
- One-to-many with `notifications`

**Triggers**:
- Updates `creator_profiles.posts_count` when post is created/deleted
- Updates `creator_profiles.likes_count` when post is liked/unliked

---

### `polls`

Poll questions associated with poll-type posts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Poll UUID |
| `post_id` | UUID | NOT NULL, UNIQUE, FK → posts.id | Associated post |
| `question` | TEXT | NOT NULL | Poll question |
| `allows_multiple_answers` | BOOLEAN | NOT NULL, DEFAULT false | Allow multiple selections |
| `expires_at` | TIMESTAMPTZ | NULLABLE | Poll expiration timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Poll creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**Relationships**:
- One-to-one with `posts`
- One-to-many with `poll_options`
- One-to-many with `poll_votes`

---

### `poll_options`

Options for poll questions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Option UUID |
| `poll_id` | UUID | NOT NULL, FK → polls.id | Associated poll |
| `option_text` | TEXT | NOT NULL | Option text |
| `position` | INTEGER | NOT NULL | Display order |
| `votes_count` | INTEGER | NOT NULL, DEFAULT 0 | Denormalized vote count |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Option creation timestamp |

**Indexes**:
- Primary key on `id`
- Index on `poll_id`
- Index on `(poll_id, position)` for ordering

**Relationships**:
- Many-to-one with `polls`
- One-to-many with `poll_votes`

---

### `poll_votes`

User votes on poll options.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Vote UUID |
| `poll_id` | UUID | NOT NULL, FK → polls.id | Associated poll |
| `option_id` | UUID | NOT NULL, FK → poll_options.id | Selected option |
| `user_id` | UUID | NOT NULL, FK → users.id | User who voted |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Vote timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `(poll_id, user_id, option_id)` to prevent duplicate votes
- Index on `poll_id`
- Index on `user_id`

**Relationships**:
- Many-to-one with `polls`
- Many-to-one with `poll_options`
- Many-to-one with `users`

---

### `post_likes`

User likes on posts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Like UUID |
| `user_id` | UUID | NOT NULL, FK → users.id | User who liked |
| `post_id` | UUID | NOT NULL, FK → posts.id | Liked post |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Like timestamp |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `(user_id, post_id)` to prevent duplicate likes
- Index on `post_id` for counting
- Index on `user_id`

**Relationships**:
- Many-to-one with `users`
- Many-to-one with `posts`

**Triggers**:
- Updates `posts.likes_count` when like is added/removed
- Creates notification when post is liked

---

### `post_comments`

Comments on posts. Supports threaded comments via `parent_comment_id`.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Comment UUID |
| `user_id` | UUID | NOT NULL, FK → users.id | User who commented |
| `post_id` | UUID | NOT NULL, FK → posts.id | Post being commented on |
| `content` | TEXT | NOT NULL | Comment text |
| `parent_comment_id` | UUID | NULLABLE, FK → post_comments.id | Parent comment (for threading) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Comment timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete timestamp |

**Indexes**:
- Primary key on `id`
- Index on `post_id` for counting
- Index on `user_id`
- Index on `parent_comment_id` for threading

**Relationships**:
- Many-to-one with `users`
- Many-to-one with `posts`
- Self-referential (parent comments)

**Triggers**:
- Updates `posts.comments_count` when comment is added/removed
- Creates notification when post is commented on

---

### `supporter_transactions`

Payment transactions from supporters to creators.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Transaction UUID |
| `supporter_id` | UUID | NOT NULL, FK → users.id | Supporter making payment |
| `creator_id` | UUID | NOT NULL, FK → users.id | Creator receiving payment |
| `amount` | NUMERIC(10,2) | NOT NULL | Payment amount in NPR |
| `message` | TEXT | NULLABLE | Support message from supporter |
| `status` | TEXT | NOT NULL, CHECK | Status: `'pending'`, `'completed'`, `'failed'`, `'cancelled'` |
| `gateway` | TEXT | NOT NULL, CHECK | Gateway: `'esewa'`, `'khalti'`, `'bank_transfer'`, `'direct'` |
| `transaction_uuid` | VARCHAR(100) | NULLABLE | Gateway transaction UUID |
| `product_code` | TEXT | NULLABLE | Gateway product code |
| `signature` | TEXT | NULLABLE | Payment signature (for verification) |
| `esewa_data` | JSONB | NULLABLE | eSewa-specific data |
| `khalti_data` | JSONB | NULLABLE | Khalti-specific data |
| `bank_data` | JSONB | NULLABLE | Bank transfer data |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Transaction timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Index on `supporter_id`
- Index on `creator_id`
- Index on `status`
- Index on `transaction_uuid` (unique)
- Composite index on `(status, created_at DESC)` for transaction queries

**Relationships**:
- Many-to-one with `users` (as `supporter_id`)
- Many-to-one with `users` (as `creator_id`)

**Triggers**:
- Updates `creator_profiles.supporters_count` when transaction is completed
- Updates `creator_profiles.total_earnings` when transaction is completed

---

### `supporters`

Supporter-creator relationships. Tracks active supporters and their tier levels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Supporter relationship UUID |
| `supporter_id` | UUID | NOT NULL, FK → users.id | Supporter user |
| `creator_id` | UUID | NOT NULL, FK → users.id | Creator being supported |
| `tier` | TEXT | NOT NULL, DEFAULT 'basic' | Tier name (legacy) |
| `tier_level` | INTEGER | NOT NULL, DEFAULT 1, CHECK | Tier level: `1`, `2`, or `3` |
| `amount` | NUMERIC(10,2) | NOT NULL | Total amount supported |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Active supporter status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Relationship creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `(supporter_id, creator_id)` to prevent duplicates
- Composite index on `(supporter_id, creator_id, is_active)` for lookups
- Index on `tier_level`

**Relationships**:
- Many-to-one with `users` (as `supporter_id`)
- Many-to-one with `users` (as `creator_id`)

**Triggers**:
- Adds supporter to appropriate community channels when created/updated

---

### `subscription_tiers`

Creator-defined subscription tiers (1★, 2★, 3★).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Tier UUID |
| `creator_id` | UUID | NOT NULL, FK → users.id | Creator who owns this tier |
| `tier_level` | INTEGER | NOT NULL, CHECK | Tier level: `1`, `2`, or `3` |
| `tier_name` | TEXT | NOT NULL | Tier display name |
| `price` | NUMERIC(10,2) | NOT NULL, CHECK >= 0 | Tier price in NPR |
| `description` | TEXT | NULLABLE | Tier description |
| `benefits` | JSONB | NOT NULL, DEFAULT '[]' | Array of benefit descriptions |
| `extra_perks` | JSONB | NOT NULL, DEFAULT '[]' | Array of custom extra perks |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Tier active status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Tier creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `(creator_id, tier_level)` to ensure one tier per level per creator
- Index on `creator_id`
- Index on `is_active`

**Relationships**:
- Many-to-one with `users` (via `creator_id`)

**Triggers**:
- Auto-creates default tiers (1★, 2★, 3★) when creator profile is created

**Default Tiers**:
- **Tier 1**: "One Star Supporter" - NPR 100 - Access to exclusive posts
- **Tier 2**: "Two Star Supporter" - NPR 500 - Posts + Community chat access
- **Tier 3**: "Three Star Supporter" - NPR 1000 - Posts + Chat + Special perks

---

### `notifications`

User notifications for likes, comments, payments, etc.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Notification UUID |
| `user_id` | UUID | NOT NULL, FK → users.id | User receiving notification |
| `type` | TEXT | NOT NULL, CHECK | Type: `'like'`, `'comment'`, `'payment'`, `'support'` |
| `actor_id` | UUID | NOT NULL, FK → users.id | User who triggered notification |
| `post_id` | UUID | NULLABLE, FK → posts.id | Associated post |
| `comment_id` | UUID | NULLABLE, FK → post_comments.id | Associated comment |
| `metadata` | JSONB | NOT NULL, DEFAULT '{}' | Additional notification data |
| `read` | BOOLEAN | NOT NULL, DEFAULT false | Read status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Notification timestamp |

**Indexes**:
- Primary key on `id`
- Index on `user_id` for user queries
- Index on `created_at DESC` for sorting
- Index on `read` for filtering unread
- Index on `type` for filtering
- Index on `post_id`

**Relationships**:
- Many-to-one with `users` (as `user_id` - recipient)
- Many-to-one with `users` (as `actor_id` - triggerer)
- Many-to-one with `posts`
- Many-to-one with `post_comments`

**RLS Policies**:
- Users can only view their own notifications
- Users can only update their own notifications (to mark as read)

**Realtime**:
- Enabled for real-time notification updates

---

### `follows`

User follow relationships (for content discovery).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Follow relationship UUID |
| `follower_id` | UUID | NOT NULL, FK → users.id | User who follows |
| `following_id` | UUID | NOT NULL, FK → users.id | User being followed |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Follow timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `(follower_id, following_id)` to prevent duplicate follows
- Index on `follower_id`
- Index on `following_id`

**Relationships**:
- Many-to-one with `users` (as `follower_id`)
- Many-to-one with `users` (as `following_id`)

**Note**: Follows are separate from supporters. Follows are free, supporters have paid.

---

### `channels`

Community channels managed by creators (Discord-like structure).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Channel UUID |
| `creator_id` | UUID | NOT NULL, FK → users.id | Creator who owns channel |
| `name` | TEXT | NOT NULL | Channel name |
| `description` | TEXT | NULLABLE | Channel description |
| `category` | TEXT | NULLABLE | Channel category |
| `channel_type` | TEXT | NOT NULL, DEFAULT 'text' | Channel type: `'text'` or `'voice'` |
| `min_tier_required` | INTEGER | NOT NULL, DEFAULT 1, CHECK | Minimum tier level required (1-3) |
| `position` | INTEGER | NOT NULL, DEFAULT 0 | Display order |
| `stream_channel_id` | TEXT | NULLABLE | Stream Chat channel ID |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Channel creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Index on `creator_id`
- Index on `min_tier_required`

**Relationships**:
- Many-to-one with `users` (via `creator_id`)
- One-to-many with `channel_members`
- One-to-many with `channel_messages`

**Triggers**:
- Adds creator and eligible supporters to channel when created

**Default Channels**:
- "All Supporters" (tier 1+) - Auto-created for each creator
- "3-Star Supporters" (tier 3 only) - Auto-created for each creator

---

### `channel_members`

Membership in community channels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Membership UUID |
| `channel_id` | UUID | NOT NULL, FK → channels.id | Channel |
| `user_id` | UUID | NOT NULL, FK → users.id | Member user |
| `joined_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Join timestamp |

**Indexes**:
- Primary key on `id`
- Unique index on `(channel_id, user_id)` to prevent duplicate memberships
- Index on `channel_id`
- Index on `user_id`

**Relationships**:
- Many-to-one with `channels`
- Many-to-one with `users`

---

### `channel_messages`

Messages in community channels.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Message UUID |
| `channel_id` | UUID | NOT NULL, FK → channels.id | Channel |
| `user_id` | UUID | NOT NULL, FK → users.id | Message author |
| `content` | TEXT | NOT NULL | Message content |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Message timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete timestamp |

**Indexes**:
- Primary key on `id`
- Index on `channel_id`
- Index on `user_id`
- Composite index on `(channel_id, created_at DESC)` for pagination

**Relationships**:
- Many-to-one with `channels`
- Many-to-one with `users`

**Realtime**:
- Enabled for real-time message updates

---

### `creator_payment_methods`

Payment methods configured by creators (eSewa, Khalti).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Payment method UUID |
| `creator_id` | UUID | NOT NULL, FK → users.id | Creator |
| `gateway` | TEXT | NOT NULL, CHECK | Gateway: `'esewa'` or `'khalti'` |
| `merchant_code` | TEXT | NULLABLE | Gateway merchant code |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Active status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

**Indexes**:
- Primary key on `id`
- Index on `creator_id`
- Index on `is_active`

**Relationships**:
- Many-to-one with `users` (via `creator_id`)

---

### `user_activities`

User activity log (for analytics and tracking).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Activity UUID |
| `user_id` | UUID | NOT NULL, FK → users.id | User who performed activity |
| `activity_type` | TEXT | NOT NULL, CHECK | Type: `'post_created'`, `'post_liked'`, `'comment_added'`, `'support_given'` |
| `target_id` | UUID | NOT NULL | Target resource ID |
| `target_type` | TEXT | NOT NULL | Target type: `'post'`, `'user'`, `'comment'`, `'transaction'` |
| `metadata` | JSONB | NOT NULL, DEFAULT '{}' | Additional activity data |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Activity timestamp |

**Indexes**:
- Primary key on `id`
- Index on `user_id`
- Index on `activity_type`
- Index on `created_at`

**Relationships**:
- Many-to-one with `users`

---

### `creator_tags`

Tags associated with creators (for categorization).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Tag UUID |
| `creator_id` | UUID | NOT NULL, FK → users.id | Creator |
| `tag` | TEXT | NOT NULL | Tag text |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Tag creation timestamp |

**Indexes**:
- Primary key on `id`
- Index on `creator_id`
- Index on `tag`

**Relationships**:
- Many-to-one with `users` (via `creator_id`)

---

## Relationships

### Entity Relationship Diagram

```
users (1) ──< (1) creator_profiles
  │
  ├──< (many) posts
  │     ├──< (many) post_likes
  │     ├──< (many) post_comments
  │     └──< (1) polls
  │           ├──< (many) poll_options
  │           └──< (many) poll_votes
  │
  ├──< (many) supporter_transactions (as supporter_id)
  ├──< (many) supporter_transactions (as creator_id)
  ├──< (many) supporters (as supporter_id)
  ├──< (many) supporters (as creator_id)
  ├──< (many) subscription_tiers
  ├──< (many) channels
  │     ├──< (many) channel_members
  │     └──< (many) channel_messages
  ├──< (many) notifications (as user_id)
  ├──< (many) notifications (as actor_id)
  ├──< (many) follows (as follower_id)
  ├──< (many) follows (as following_id)
  └──< (many) user_activities
```

### Key Relationships

1. **Users ↔ Creator Profiles**: One-to-one (only creators have profiles)
2. **Users ↔ Posts**: One-to-many (creators create posts)
3. **Posts ↔ Likes**: One-to-many (posts have many likes)
4. **Posts ↔ Comments**: One-to-many (posts have many comments)
5. **Posts ↔ Polls**: One-to-one (poll-type posts have one poll)
6. **Polls ↔ Options**: One-to-many (polls have multiple options)
7. **Supporters ↔ Creators**: Many-to-many via `supporters` table
8. **Channels ↔ Members**: Many-to-many via `channel_members` table

---

## Indexes

### Performance Indexes

The database includes comprehensive indexing for optimal query performance:

#### Composite Indexes

1. **Posts Feed Query**:
   ```sql
   idx_posts_created_public ON posts(creator_id, is_public, created_at DESC)
   ```

2. **Engagement Sorting**:
   ```sql
   idx_posts_engagement_score ON posts(created_at DESC, likes_count DESC, comments_count DESC)
   ```

3. **Supporters Lookup**:
   ```sql
   idx_supporters_supporter_creator_active ON supporters(supporter_id, creator_id, is_active)
   ```

4. **Transaction Queries**:
   ```sql
   idx_supporter_transactions_status_created ON supporter_transactions(status, created_at DESC)
   ```

5. **Channel Messages Pagination**:
   ```sql
   idx_channel_messages_channel_created ON channel_messages(channel_id, created_at DESC)
   ```

#### Single Column Indexes

- All foreign keys are indexed
- Frequently queried columns (status, type, etc.) are indexed
- Timestamp columns used for sorting are indexed

---

## Triggers & Functions

### Count Maintenance Triggers

#### `update_post_likes_count()`
- **Trigger**: `post_likes_count_trigger` on `post_likes`
- **Action**: Updates `posts.likes_count` when likes are added/removed
- **Operations**: INSERT, DELETE

#### `update_post_comments_count()`
- **Trigger**: `post_comments_count_trigger` on `post_comments`
- **Action**: Updates `posts.comments_count` when comments are added/removed
- **Operations**: INSERT, DELETE

#### `update_creator_supporters_count()`
- **Trigger**: `update_supporters_count_trigger` on `supporter_transactions`
- **Action**: Updates `creator_profiles.supporters_count` when transactions are completed
- **Operations**: INSERT, UPDATE

### Notification Triggers

#### `create_like_notification()`
- **Trigger**: `trigger_create_like_notification` on `post_likes`
- **Action**: Creates notification when post is liked
- **Condition**: Only if liker is not the post creator

#### `create_comment_notification()`
- **Trigger**: `trigger_create_comment_notification` on `post_comments`
- **Action**: Creates notification when post is commented on
- **Condition**: Only if commenter is not the post creator

### Channel Management Triggers

#### `create_creator_default_channels()`
- **Trigger**: `on_creator_profile_created` on `creator_profiles`
- **Action**: Auto-creates default channels when creator profile is created
- **Channels Created**: "All Supporters" (tier 1+), "3-Star Supporters" (tier 3)

#### `add_supporter_to_channels()`
- **Trigger**: `on_supporter_created` on `supporters`
- **Action**: Adds supporter to appropriate channels based on tier level
- **Operations**: INSERT, UPDATE

#### `add_existing_supporters_to_new_channel()`
- **Trigger**: `on_channel_created` on `channels`
- **Action**: Adds creator and eligible existing supporters to new channel

### Tier Management Triggers

#### `create_default_tiers_for_creator()`
- **Trigger**: `create_default_tiers_on_creator_profile` on `creator_profiles`
- **Action**: Auto-creates 3 default subscription tiers when creator profile is created

---

## Database Functions

### `search_creators(search_query TEXT, search_limit INTEGER)`

Searches creators by name, bio, or category.

**Parameters**:
- `search_query`: Search text
- `search_limit`: Maximum results (default: 20)

**Returns**: Table with creator details

**Usage**:
```sql
SELECT * FROM search_creators('music', 10);
```

### `get_discovery_feed(user_uuid UUID, feed_limit INTEGER)`

Generates personalized discovery feed for a user.

**Parameters**:
- `user_uuid`: User UUID
- `feed_limit`: Maximum posts (default: 50)

**Returns**: Table with post details and engagement metrics

**Usage**:
```sql
SELECT * FROM get_discovery_feed('user-id', 20);
```

### `get_creator_transaction_stats(creator_uuid UUID)`

Calculates transaction statistics for a creator.

**Parameters**:
- `creator_uuid`: Creator UUID

**Returns**: Table with total amounts and transaction counts

**Usage**:
```sql
SELECT * FROM get_creator_transaction_stats('creator-id');
```

### `get_creator_profile(creator_user_id UUID, current_user_id UUID)`

Gets creator profile with supporter status.

**Parameters**:
- `creator_user_id`: Creator UUID
- `current_user_id`: Current user UUID (optional)

**Returns**: Table with creator details and `is_supporter` flag

**Usage**:
```sql
SELECT * FROM get_creator_profile('creator-id', 'user-id');
```

---

## Row Level Security (RLS)

### Tables with RLS Enabled

1. **notifications**: Users can only view/update their own notifications
2. **posts**: Public posts visible to all, private posts visible to supporters
3. **channels**: Members can view channels they belong to
4. **channel_messages**: Members can view messages in their channels

### RLS Policies

#### Notifications
- **View**: `auth.uid() = user_id`
- **Update**: `auth.uid() = user_id`

#### Posts
- **View**: `is_public = true` OR user is supporter with appropriate tier

#### Channels
- **View**: User is member of channel

---

## Performance Optimizations

### Denormalized Counts

The following counts are denormalized for performance:

- `posts.likes_count` - Updated via trigger
- `posts.comments_count` - Updated via trigger
- `creator_profiles.supporters_count` - Updated via trigger
- `creator_profiles.posts_count` - Updated via trigger
- `creator_profiles.likes_count` - Updated via trigger
- `poll_options.votes_count` - Updated via trigger

### Query Optimization

1. **Composite Indexes**: Optimize multi-column queries
2. **Partial Indexes**: Index only non-deleted records
3. **Covering Indexes**: Include frequently accessed columns
4. **Function-Based Indexes**: For computed values

### Caching Strategy

- React Query caches query results client-side
- Database query results cached by Supabase
- Denormalized counts reduce aggregation queries

---

## Migration History

All migrations are stored in `supabase/migrations/`:

1. `20240101000009_create_search_functions.sql` - Search functions
2. `20240101000010_fix_user_profile_trigger.sql` - User profile triggers
3. `20240101000011_fix_function_search_path.sql` - Function paths
4. `20240114000000_remove_followers_system.sql` - Removed followers, added supporters
5. `20240115000000_create_notifications.sql` - Notification system
6. `20240115000001_enable_realtime_channel_messages.sql` - Realtime messages
7. `20240115000002_enable_realtime_notifications.sql` - Realtime notifications
8. `20260117000000_add_social_links_and_onboarding.sql` - Social links
9. `20260117010000_create_subscription_tiers.sql` - Subscription tiers
10. `20260117020000_add_direct_payment_method.sql` - Direct payments
11. `20260124000000_performance_optimizations.sql` - Performance indexes
12. `20260126000000_fix_channel_triggers.sql` - Channel triggers
13. `20260127000000_add_extra_perks_to_tiers.sql` - Extra perks

---

## Data Types Reference

### Common Types

- **UUID**: Primary keys and foreign keys
- **TEXT**: Variable-length strings
- **NUMERIC(10,2)**: Monetary amounts (10 digits, 2 decimal places)
- **BOOLEAN**: True/false values
- **TIMESTAMPTZ**: Timestamps with timezone
- **JSONB**: JSON data with indexing support
- **TEXT[]**: Array of text values

### Enums & Constraints

- **User Roles**: `'user'`, `'creator'`
- **Post Types**: `'post'`, `'poll'`
- **Tier Levels**: `1`, `2`, `3`
- **Transaction Status**: `'pending'`, `'completed'`, `'failed'`, `'cancelled'`
- **Payment Gateways**: `'esewa'`, `'khalti'`, `'bank_transfer'`, `'direct'`
- **Notification Types**: `'like'`, `'comment'`, `'payment'`, `'support'`

---

## Best Practices

### Querying

1. **Use Indexes**: Always query on indexed columns
2. **Limit Results**: Use `LIMIT` for pagination
3. **Select Specific Columns**: Avoid `SELECT *`
4. **Use Functions**: Use database functions for complex queries

### Modifications

1. **Use Transactions**: For multi-step operations
2. **Respect Foreign Keys**: Ensure referenced records exist
3. **Update Timestamps**: Let triggers handle `updated_at`
4. **Soft Deletes**: Use `deleted_at` instead of hard deletes

### Performance

1. **Monitor Slow Queries**: Use Supabase query analyzer
2. **Add Indexes**: For frequently queried columns
3. **Denormalize**: For frequently accessed counts
4. **Use Composite Indexes**: For multi-column queries

---

**Last Updated**: January 2025
