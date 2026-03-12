import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | MeroCircle",
  description:
    "Learn how MeroCircle collects, uses, and protects your data as a creator or supporter.",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="text-muted-foreground">
        Your privacy matters to us. This page explains, at a high level, how we handle
        information when you use MeroCircle. You should replace this placeholder content
        with a full policy reviewed by your legal or compliance team.
      </p>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p className="text-muted-foreground">
          We may collect information you provide (such as your name, email, and profile
          details) as well as usage data and technical information needed to operate the
          service.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
        <p className="text-muted-foreground">
          We use your information to operate MeroCircle, process payments, improve the
          product, and keep the platform safe. We do not sell your personal information.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Your Choices</h2>
        <p className="text-muted-foreground">
          You can update your profile information and notification preferences from your
          account settings. To request data deletion or access, please contact the team
          at the email address listed on this site.
        </p>
      </section>
    </main>
  );
}

