# Welcome Email Implementation

## Overview
Automatic welcome email sent to new users via a reliable queue-based system.

## Architecture (Senior Developer Approach)

### Queue-Based System
```
User Signs Up
    ↓
auth.users INSERT
    ↓
PostgreSQL Trigger (queue_welcome_email)
    ↓
Insert into email_queue table
    ↓
Cron Job (every minute)
    ↓
Process Queue → Send Email
```

**Why this approach:**
- ✅ **Reliable**: Retries on failure (exponential backoff)
- ✅ **Observable**: Query queue status anytime
- ✅ **No HTTP calls from DB**: Just inserts to table
- ✅ **Rate limiting**: Process in batches
- ✅ **Easy local dev**: No ngrok needed
- ✅ **All logic in Next.js**: Email templates stay in your app

## Setup Instructions

### 1. Run Migration
```bash
# Apply the email queue migration
npx supabase db push

# Or in Supabase dashboard
# Copy: supabase/migrations/20260131000001_email_queue_system.sql
```

### 2. Set Cron Secret (Optional but Recommended)
Add to `.env.local`:
```env
CRON_SECRET=generate-a-random-secret
```

Generate secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Set Up Vercel Cron (Production)
The `vercel.json` is already configured to run every minute.

In Vercel dashboard:
1. Go to **Project Settings** → **Environment Variables**
2. Add `CRON_SECRET` with your secret value
3. Deploy

Vercel will automatically call `/api/email/process-queue` every minute.

### 4. Local Development
Manually trigger the queue processor:
```bash
# Process pending emails
curl -X POST http://localhost:3000/api/email/process-queue

# Or with cron secret
curl -X POST http://localhost:3000/api/email/process-queue \
  -H "Authorization: Bearer your-cron-secret"
```

Or use a tool like `cron-job.org` pointing to your localhost (via ngrok).

## Files Created

### Database:
- `supabase/migrations/20260131000001_email_queue_system.sql` - Queue table and trigger

### API Routes:
- `app/api/email/process-queue/route.ts` - Queue processor (cron endpoint)
- `app/api/webhooks/user-created/route.ts` - (Old approach, can be deleted)

### Config:
- `vercel.json` - Cron job configuration

### Functions:
- `lib/email.ts` - `sendWelcomeEmail()` function

## How It Works

### 1. User Signs Up
- New row inserted into `auth.users`
- Trigger automatically inserts into `email_queue` with:
  ```json
  {
    "email_type": "welcome",
    "recipient_email": "user@example.com",
    "payload": {
      "userId": "...",
      "userName": "John Doe",
      "userRole": "supporter"
    },
    "status": "pending"
  }
  ```

### 2. Cron Job Runs (Every Minute)
- Fetches up to 10 pending emails
- Marks as `processing`
- Sends email
- Updates status to `sent` or back to `pending` for retry

### 3. Retry Logic
- Failed emails retry with exponential backoff:
  - Attempt 1: Retry after 5 minutes
  - Attempt 2: Retry after 25 minutes  
  - Attempt 3: Retry after 125 minutes
- After 3 attempts, status = `failed` (manual intervention needed)

## Monitoring

### Check Queue Status
```bash
# Get stats
curl http://localhost:3000/api/email/process-queue

# Response:
{
  "stats": {
    "pending": 5,
    "sent": 143,
    "failed": 2
  }
}
```

### Query Database Directly
```sql
-- See pending emails
SELECT * FROM email_queue 
WHERE status = 'pending' 
ORDER BY created_at DESC;

-- See failed emails
SELECT id, email_type, recipient_email, attempts, last_error 
FROM email_queue 
WHERE status = 'failed';

-- Retry a failed email
UPDATE email_queue 
SET status = 'pending', scheduled_for = NOW()
WHERE id = 'email-id-here';
```

## Extending the System

### Add More Email Types
In `app/api/email/process-queue/route.ts`:

```typescript
case 'post_notification':
  success = await sendPostNotificationEmail({
    supporterEmail: emailJob.recipient_email,
    // ... other fields from emailJob.payload
  });
  break;
```

Then queue them:
```typescript
await supabase.from('email_queue').insert({
  email_type: 'post_notification',
  recipient_email: 'user@example.com',
  payload: { /* your data */ }
});
```

## Advantages Over Webhook Approach

| Feature | Webhook | Queue System |
|---------|---------|--------------|
| Reliability | ❌ Fails if Next.js down | ✅ Queued, retries |
| Local Dev | ❌ Needs ngrok | ✅ Works locally |
| Observability | ❌ Black box | ✅ Query queue status |
| Complexity | ❌ pg_net, secrets | ✅ Just a table |
| Rate Limiting | ❌ Manual | ✅ Built-in batching |
| Retry Logic | ❌ Manual | ✅ Automatic |

## Production Checklist

- [ ] Migration applied to production database
- [ ] `CRON_SECRET` set in Vercel environment variables
- [ ] SMTP credentials configured
- [ ] Vercel Cron enabled (automatic with vercel.json)
- [ ] Test signup flow end-to-end
- [ ] Monitor queue for first 24 hours
- [ ] Set up alerts for emails stuck in `failed` status

## Troubleshooting

### Emails not sending?
1. Check SMTP credentials
2. Manually trigger processor: `POST /api/email/process-queue`
3. Query queue: `SELECT * FROM email_queue WHERE status = 'failed'`
4. Check logs in Vercel dashboard

### Cron not running?
1. Verify `vercel.json` exists in project root
2. Check Vercel dashboard → Cron Jobs (should show 1 job)
3. Ensure project is deployed (cron only works in production)

### For local development:
Run manually or use a local cron:
```bash
# Add to crontab (runs every minute)
* * * * * curl -X POST http://localhost:3000/api/email/process-queue
```
