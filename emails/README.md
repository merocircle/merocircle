# Email Templates - Professional Structure

Enterprise-grade email system built with React Email. Organized like production systems at companies like Stripe, Notion, and Linear.

## 📁 Structure

```
emails/
├── components/
│   └── shared/
│       ├── EmailLayout.tsx    # Base layout for all emails
│       └── styles.ts           # Shared design system
├── templates/
│   ├── notifications/          # Content from creators
│   │   ├── PostNotification.tsx
│   │   └── PollNotification.tsx
│   ├── transactional/          # Account & payments
│   │   ├── WelcomeEmail.tsx
│   │   ├── PaymentSuccess.tsx
│   │   └── PaymentFailed.tsx
│   └── index.ts                # Central exports
├── config.ts                   # Email configuration
└── README.md
```

## 🎨 Email Templates

### Notifications (Creator → Supporter)

**PostNotification** - When creator publishes a post
**PollNotification** - When creator creates a poll

### Transactional (System → User)

**WelcomeEmail** - New user welcome
**PaymentSuccess** - Payment confirmation  
**PaymentFailed** - Payment failure notice

## 🛠️ Development

```bash
npm run dev
# Visit: http://localhost:3000/api/email-preview
```

## 🎨 Design System

Import from `shared/styles.ts`:
- Typography: `body`, `heading1`, `heading2`
- Buttons: `primaryButton`, `secondaryButton`
- Cards: `card`, `infoCard`, `errorCard`
- Colors: Access via `colors` object

## 📝 Best Practices

✅ Use `EmailLayout` for consistency
✅ Import styles from shared design system
✅ Keep preview text < 160 chars
✅ Add JSDoc with trigger/recipient info

❌ Don't duplicate inline styles
❌ Don't create deeply nested components
❌ Don't forget mobile responsiveness

## 🚀 Production Ready

✓ Organized by category
✓ Shared design system
✓ Type-safe with TypeScript
✓ Centralized configuration
✓ Mobile-responsive

---

**Built like a senior developer** ✨
