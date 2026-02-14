"use client";

import Link from "next/link";
import { useReveal } from "../useReveal";
import "./CTASection.css";

function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [ref, isVisible] = useReveal();
  return (
    <div
      ref={ref}
      className={`cta-reveal ${isVisible ? "cta-reveal-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function CTASection() {
  return (
    <section className="cta-section">
      <div className="cta-section-bg" aria-hidden />
      <RevealSection className="cta-section-inner">
        <h2 className="cta-section-title">
          READY TO SUPPORT
          <br />
          <span className="cta-section-title-accent">YOUR CREATOR?</span>
        </h2>
        <p className="cta-section-quote">
          &ldquo;Join thousands of supporters making a difference in Nepal.&rdquo;
        </p>
        <div className="cta-section-actions">
          <Link href="/auth" className="cta-section-btn">
            Start Your Journey
          </Link>
        </div>
      </RevealSection>
    </section>
  );
}
