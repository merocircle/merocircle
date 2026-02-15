"use client";

import Link from "next/link";
import Image from "next/image";
import "./LandingNav.css";

export function LandingNav() {
  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <Link href="/" className="landing-nav-logo">
          <Image
            src="/logo/logo-light.png"
            alt="MeroCircle"
            width={32}
            height={32}
            className="landing-nav-logo-img"
          />
          <span className="landing-nav-logo-text">MeroCircle</span>
        </Link>

        <div className="landing-nav-right">
          <Link href="/about" className="landing-nav-about">
            About
          </Link>
          <Link href="/auth" className="landing-nav-cta">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
