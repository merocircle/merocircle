"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import "./HeroSection.css";

export function HeroSection() {
  return (
    <section className="hero">
      {/* Animated connection lines background */}
      <div className="hero-connections" aria-hidden>
        <svg className="hero-connections-svg" viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice">
          {/* Floating dots - positioned above and below center only */}
          <circle className="hero-dot hero-dot-1" cx="75" cy="50" r="3" />
          <circle className="hero-dot hero-dot-2" cx="175" cy="30" r="2.5" />
          <circle className="hero-dot hero-dot-3" cx="450" cy="45" r="3" />
          <circle className="hero-dot hero-dot-4" cx="525" cy="60" r="2" />
          <circle className="hero-dot hero-dot-5" cx="100" cy="350" r="2.5" />
          <circle className="hero-dot hero-dot-6" cx="375" cy="370" r="3" />
          <circle className="hero-dot hero-dot-7" cx="300" cy="25" r="2" />
          <circle className="hero-dot hero-dot-8" cx="225" cy="375" r="2.5" />
          <circle className="hero-dot hero-dot-9" cx="500" cy="360" r="2" />
          <circle className="hero-dot hero-dot-10" cx="50" cy="340" r="2" />

          {/* Connection lines - avoid center area */}
          <line className="hero-line hero-line-1" x1="75" y1="50" x2="175" y2="30" />
          <line className="hero-line hero-line-2" x1="175" y1="30" x2="300" y2="25" />
          <line className="hero-line hero-line-3" x1="300" y1="25" x2="450" y2="45" />
          <line className="hero-line hero-line-4" x1="450" y1="45" x2="525" y2="60" />
          <line className="hero-line hero-line-5" x1="75" y1="50" x2="100" y2="350" />
          <line className="hero-line hero-line-6" x1="100" y1="350" x2="225" y2="375" />
          <line className="hero-line hero-line-7" x1="375" y1="370" x2="500" y2="360" />
          <line className="hero-line hero-line-8" x1="300" y1="25" x2="375" y2="370" />
          <line className="hero-line hero-line-9" x1="50" y1="340" x2="75" y2="50" />
          <line className="hero-line hero-line-10" x1="525" y1="60" x2="500" y2="360" />

          {/* Central glow pulse - removed to avoid center overlap */}
        </svg>
      </div>

      {/* Subtle radial glow */}
      <div className="hero-glow" aria-hidden />

      <div className="hero-inner">
        {/* Headline */}
        <h1 className="hero-title">
          Your favorite creator,
          <br />
          <span className="hero-accent">closer than ever.</span>
        </h1>

        {/* Subheadline */}
        <p className="hero-sub">
          Join the inner circle of the creators who inspire you. Get exclusive
          posts, private chats, and a real connection.
        </p>

        {/* Single CTA */}
        <div className="hero-cta-wrap">
          <Link href="/auth" className="hero-cta">
            Get Started
            <ArrowRight size={18} className="hero-cta-arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}
