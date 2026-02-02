# 🚀 Email System - Quick Reference

## One-Line Summary
Queue-based email system that sends welcome emails when users sign up via Google OAuth.

---

## ✅ What's Implemented

| Feature | Status | Location |
|---------|--------|----------|
| Welcome Email Queue | ✅ | `lib/auth.ts` (NextAuth callback) |
| Queue Processor | ✅ | `/api/email/process-queue` |
| Email Templates | ✅ | `emails/templates/transactional/WelcomeEmail.tsx` |
| Health Monitoring | ✅ | `/api/email/stats` |
| Manual Send | ✅ | `/api/email/send-welcome` |
| Test Script | ✅ | `scripts/test-email-system.js` |

---

## 🔧 Quick Commands

```bash
# Check system health
curl http://localhost:3000/api/email/stats

# Process queue now
curl -X POST http://localhost:3000/api/email/process-queue \
  -H "Authorization: Bearer $CRON_SECRET"

# Send test email
curl -X POST http://localhost:3000/api/email/send-welcome \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Run test script
node scripts/test-email-system.js
```

---

## 📊 Key Metrics to Monitor

1. **Success Rate**: Should be > 95%
2. **Queue Backlog**: Should be < 50 emails
3. **Oldest Pending**: Should be < 10 minutes
4. **Failed Emails**: Review and investigate

---

## 🐛 Quick Debug Checklist

- [ ] Check `/api/email/stats` - Any emails queued?
- [ ] Check SMTP credentials in `.env`
- [ ] Process queue manually
- [ ] Check terminal logs for errors
- [ ] Verify `email_queue` table exists
- [ ] Test SMTP connection directly

---

## 🎯 Flow Diagram

```
Sign Up → Create User → Queue Email → Return to User
                              ↓
                         [Background]
                              ↓
                      Process Queue (1 min)
                              ↓
                         Send Email
                              ↓
                      User Receives Email
```

---

## 🔑 Environment Variables

```env
# Required
SMTP_USER=notification@merocircle.app
SMTP_PASSWORD=your-password
CRON_SECRET=your-secret

# Optional (defaults shown)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
```

---

## 💡 Pro Tips

1. **Non-blocking**: Auth never waits for email
2. **Retry Logic**: 3 attempts with exponential backoff
3. **Graceful**: Signup succeeds even if email fails
4. **Monitored**: Check `/api/email/stats` anytime
5. **Tested**: Use MailDev for local testing

---

## 📞 Common Issues

| Issue | Solution |
|-------|----------|
| No emails sending | Check SMTP credentials, process queue manually |
| Queue growing | Check cron is running, process manually |
| High failure rate | Check SMTP rate limits, verify email addresses |
| Stale queue | Process queue, check processor logs |

---

## 🎓 Senior Dev Wisdom

> "Always queue emails, never block the user flow, monitor everything, and have graceful fallbacks."

**Core Principles:**
1. **Reliability** - Queue + retry logic
2. **Observability** - Metrics + health checks
3. **User Experience** - Non-blocking + fast
4. **Maintainability** - Simple, tested, documented

---

Read full docs: [`docs/EMAIL-SYSTEM-GUIDE.md`](./EMAIL-SYSTEM-GUIDE.md)
