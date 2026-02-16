"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import "./HeroSection.css";

export function HeroSection() {
  return (
    <section className="hero">
      {/* Animated connection lines background */}
      <div className="hero-connections" aria-hidden>
        <svg className="hero-connections-svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          {/* Floating dots */}
          <circle className="hero-dot hero-dot-1" cx="150" cy="200" r="3" />
          <circle className="hero-dot hero-dot-2" cx="350" cy="120" r="2.5" />
          <circle className="hero-dot hero-dot-3" cx="900" cy="180" r="3" />
          <circle className="hero-dot hero-dot-4" cx="1050" cy="350" r="2" />
          <circle className="hero-dot hero-dot-5" cx="200" cy="550" r="2.5" />
          <circle className="hero-dot hero-dot-6" cx="750" cy="650" r="3" />
          <circle className="hero-dot hero-dot-7" cx="600" cy="100" r="2" />
          <circle className="hero-dot hero-dot-8" cx="450" cy="700" r="2.5" />
          <circle className="hero-dot hero-dot-9" cx="1000" cy="600" r="2" />
          <circle className="hero-dot hero-dot-10" cx="100" cy="400" r="2" />

          {/* Connection lines between dots */}
          <line className="hero-line hero-line-1" x1="150" y1="200" x2="350" y2="120" />
          <line className="hero-line hero-line-2" x1="350" y1="120" x2="600" y2="100" />
          <line className="hero-line hero-line-3" x1="600" y1="100" x2="900" y2="180" />
          <line className="hero-line hero-line-4" x1="900" y1="180" x2="1050" y2="350" />
          <line className="hero-line hero-line-5" x1="150" y1="200" x2="200" y2="550" />
          <line className="hero-line hero-line-6" x1="200" y1="550" x2="450" y2="700" />
          <line className="hero-line hero-line-7" x1="750" y1="650" x2="1000" y2="600" />
          <line className="hero-line hero-line-8" x1="600" y1="100" x2="750" y2="650" />
          <line className="hero-line hero-line-9" x1="100" y1="400" x2="150" y2="200" />
          <line className="hero-line hero-line-10" x1="1050" y1="350" x2="1000" y2="600" />

          {/* Central glow pulse */}
          <circle className="hero-pulse" cx="600" cy="400" r="120" />
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
