import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | MeroCircle",
  description:
    "Read the terms of service for using MeroCircle to support and connect with creators in Nepal.",
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <p className="text-muted-foreground">
        These terms govern your use of MeroCircle. By accessing or using the platform,
        you agree to these terms. This page is a simplified version and may be updated
        as the product evolves.
      </p>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Using MeroCircle</h2>
        <p className="text-muted-foreground">
          You agree to use MeroCircle in a lawful way and to respect creators and other
          supporters on the platform. Do not use the service for spam, abuse, or any
          illegal activities.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Payments and Support</h2>
        <p className="text-muted-foreground">
          When you support a creator, you authorize us and our payment partners to
          process payments on your behalf. Actual legal language for payments, refunds,
          and disputes should be added here by your legal team.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Changes to These Terms</h2>
        <p className="text-muted-foreground">
          We may update these terms from time to time. When we do, we&apos;ll update
          this page so you can review the latest version.
        </p>
      </section>
    </main>
  );
}

