"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useReveal } from "../useReveal";
import "./CTASection.css";

export function CTASection() {
  const [ref, isVisible] = useReveal();

  return (
    <section className="final-cta" ref={ref}>
      <div className={`final-cta-inner ${isVisible ? "final-cta-visible" : ""}`}>
        <h2 className="final-cta-title">
          Your creator is already here.
          <br />
          <span className="final-cta-accent">Are you?</span>
        </h2>

        <p className="final-cta-sub">
          Every day you wait is a post you miss, a conversation
          you&apos;re not part of, and a circle that grows without you.
        </p>

        <Link href="/auth" className="final-cta-btn">
          Get Started
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}
