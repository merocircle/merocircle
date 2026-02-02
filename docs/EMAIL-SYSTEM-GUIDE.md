# Email System - Senior Developer Implementation

## 🎯 Overview

A robust, queue-based email system with retry logic, monitoring, and observability.

### Key Features
- ✅ **Queue-based** - Reliable delivery with automatic retries
- ✅ **Non-blocking** - Auth flow never waits for email
- ✅ **Monitored** - Health checks and statistics
- ✅ **Tested** - Built-in testing tools
- ✅ **Graceful degradation** - Signup succeeds even if email fails

---

## 🏗️ Architecture

```
User Signs In (Google OAuth)
    ↓
NextAuth Callback (lib/auth.ts)
    ↓
Create User in DB
    ↓
Queue Welcome Email (email_queue table)
    ↓
Trigger Background Processor (non-blocking)
    ↓
User Redirected to Dashboard
    ↓
[Background] Email Sent within seconds
    ↓
User receives welcome email
```

---

## 🚀 Quick Start

### 1. Environment Variables

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=notification@merocircle.app
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=notification@merocircle.app

# Cron Security
CRON_SECRET=generate-a-random-32-char-secret
```

### 2. Database Migration

The email queue table should already be created. Verify:

```sql
SELECT * FROM email_queue LIMIT 1;
```

### 3. Test the System

```bash
# Check health
curl http://localhost:3000/api/email/stats

# Process queue manually
curl -X POST http://localhost:3000/api/email/process-queue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Send test welcome email
curl -X POST http://localhost:3000/api/email/send-welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Or use the test script
node scripts/test-email-system.js test@example.com
```

---

## 📊 Monitoring

### Health Check Endpoint

**GET** `/api/email/stats`

Returns:
```json
{
  "success": true,
  "timestamp": "2026-02-02T10:30:00Z",
  "stats": {
    "pending": 2,
    "processing": 0,
    "sent": 145,
    "failed": 3,
    "total": 150
  },
  "health": {
    "status": "healthy",
    "score": 96.7,
    "issues": []
  },
  "recentFailures": [],
  "queueAge": null
}
```

### Queue Processor Endpoint

**POST** `/api/email/process-queue`

Headers:
```
Authorization: Bearer YOUR_CRON_SECRET
```

Returns:
```json
{
  "success": true,
  "processed": 5,
  "sent": 4,
  "failed": 1,
  "duration": 1234,
  "timestamp": "2026-02-02T10:30:00Z"
}
```

---

## 🔄 How It Works

### 1. User Signs Up

When a user signs in via Google OAuth:

```typescript
// lib/auth.ts - signIn callback
if (isNewUser) {
  // Create user
  const newUser = await createUser(user);
  
  // Queue welcome email (non-blocking)
  await queueWelcomeEmail(newUser);
  
  // Trigger processor in background
  fetch('/api/email/process-queue').catch(() => {
    // Silent fail - cron will pick it up
  });
}
```

### 2. Email Queued

Email is inserted into `email_queue` table:

```sql
INSERT INTO email_queue (
  email_type,
  recipient_email,
  payload,
  scheduled_for
) VALUES (
  'welcome',
  'user@example.com',
  '{"userId": "123", "userName": "John"}',
  NOW()
);
```

### 3. Processor Runs

Either triggered immediately or via cron (every minute):

```typescript
// Fetch pending emails
const emails = await fetchPendingEmails();

// Process each
for (const email of emails) {
  try {
    await sendEmail(email);
    await markAsSent(email.id);
  } catch (error) {
    await retryLater(email.id, error);
  }
}
```

### 4. Retry Logic

Failed emails are retried with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 5 minutes later
- Attempt 3: 25 minutes later
- After 3 attempts: Marked as failed

---

## 🧪 Testing

### Local Testing with MailDev

```bash
# Run MailDev (catches all emails)
docker run -d -p 1080:1080 -p 1025:1025 maildev/maildev

# Update .env.local
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false

# View emails at http://localhost:1080
```

### Test Script

```bash
# Basic health check
node scripts/test-email-system.js

# Send test email to specific address
node scripts/test-email-system.js john@example.com
```

### Manual Testing

```bash
# 1. Sign up a new user via UI
# 2. Check email queue
curl http://localhost:3000/api/email/stats

# 3. Process queue
curl -X POST http://localhost:3000/api/email/process-queue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# 4. Check logs in terminal
```

---

## 🔍 Troubleshooting

### Emails Not Sending

**1. Check queue has emails**
```bash
curl http://localhost:3000/api/email/stats
```

**2. Check SMTP credentials**
```bash
# Test SMTP connection manually
node -e "
const nodemailer = require('nodemailer');
nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'notification@merocircle.app',
    pass: 'YOUR_PASSWORD'
  }
}).verify().then(() => console.log('✅ SMTP OK')).catch(console.error);
"
```

**3. Process queue manually**
```bash
curl -X POST http://localhost:3000/api/email/process-queue \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**4. Check logs**
```bash
# In your terminal running dev server
# Look for "EMAIL" or "EMAIL_QUEUE" logs
```

### Cron Not Running

**On Vercel:**
1. Check Vercel dashboard → Cron Jobs
2. Verify `vercel.json` has cron configuration
3. Check deployment logs

**Fallback:** Trigger manually via GitHub Actions or external cron

### High Failure Rate

1. Check SMTP rate limits
2. Verify email addresses are valid
3. Check for spam filters
4. Review recent failures:
```bash
curl http://localhost:3000/api/email/stats
```

---

## 📈 Production Optimization

### 1. Use Resend (Recommended)

Better deliverability, webhooks, analytics:

```bash
npm install resend
```

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'MeroCircle <notification@merocircle.app>',
  to: user.email,
  subject: 'Welcome to MeroCircle',
  react: WelcomeEmail({ userName: user.name }),
});
```

### 2. Email Deliverability

**Setup SPF record:**
```
v=spf1 include:_spf.hostinger.com ~all
```

**Setup DKIM:**
Contact your email provider for DKIM keys

**Setup DMARC:**
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@merocircle.app
```

### 3. Monitoring Alerts

Setup alerts for:
- Failed email rate > 5%
- Queue backlog > 100 emails
- Oldest pending email > 30 minutes

### 4. Rate Limiting

```typescript
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 h"),
});

await ratelimit.limit(userId);
```

---

## 🎓 Best Practices

### ✅ Do's

1. **Always queue emails** - Never send synchronously
2. **Idempotency** - Check if email already sent
3. **Graceful degradation** - Auth succeeds even if email fails
4. **Monitor metrics** - Track delivery rates
5. **User control** - Allow resending from settings
6. **Test thoroughly** - Use MailDev locally
7. **Retry logic** - Exponential backoff

### ❌ Don'ts

1. **Don't block user flow** - Email sending should be async
2. **Don't spam** - Respect unsubscribe preferences
3. **Don't send plain text passwords** - Ever
4. **Don't ignore failures** - Monitor and alert
5. **Don't use production SMTP in dev** - Use MailDev
6. **Don't forget SPF/DKIM** - Poor deliverability otherwise
7. **Don't skip testing** - Email issues are hard to debug in prod

---

## 📝 API Reference

### Send Welcome Email

**POST** `/api/email/send-welcome`

Request:
```json
{
  "userId": "user-uuid",
  // OR
  "email": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "message": "Welcome email queued successfully",
  "queueId": "queue-uuid",
  "recipient": "user@example.com",
  "action": "queued"
}
```

### Email Stats

**GET** `/api/email/stats`

Response: See monitoring section above

### Process Queue

**POST** `/api/email/process-queue`

Headers:
```
Authorization: Bearer CRON_SECRET
```

Response: See monitoring section above

---

## 🚧 Roadmap

### Phase 1: Core (✅ Complete)
- [x] Queue-based email system
- [x] Welcome emails on signup
- [x] Retry logic
- [x] Basic monitoring

### Phase 2: Monitoring (✅ Complete)
- [x] Health check endpoint
- [x] Statistics endpoint
- [x] Manual send endpoint
- [x] Test script

### Phase 3: Optimize (Next)
- [ ] Switch to Resend
- [ ] Email webhooks (opened, clicked)
- [ ] User email preferences
- [ ] Email analytics dashboard

### Phase 4: Advanced (Future)
- [ ] A/B testing templates
- [ ] Email scheduling
- [ ] Transactional emails (receipts, etc.)
- [ ] Email marketing campaigns

---

## 🤝 Contributing

When adding new email types:

1. Add type to migration:
```sql
ALTER TABLE email_queue 
ALTER COLUMN email_type 
SET CHECK (email_type IN ('welcome', 'your_new_type', ...));
```

2. Create React Email template:
```tsx
// emails/templates/YourEmail.tsx
export default function YourEmail({ props }) {
  return <EmailLayout>...</EmailLayout>;
}
```

3. Add to processor:
```typescript
// app/api/email/process-queue/route.ts
case 'your_new_type':
  success = await sendYourEmail(payload);
  break;
```

4. Add send function:
```typescript
// lib/email.ts
export async function sendYourEmail(data) {
  // Implementation
}
```

---

## 📞 Support

- Check logs first
- Review troubleshooting section
- Test with script
- Check Vercel cron logs (production)

---

**Last Updated:** February 2, 2026  
**Maintained by:** Development Team
