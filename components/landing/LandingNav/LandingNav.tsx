"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import "./LandingNav.css";

const NAV_LINKS: { label: string; href: string; isPage?: boolean }[] = [
  { label: "Why MeroCircle", href: "/#why-merocircle" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Support Types", href: "/#support-types" },
  { label: "For Creators", href: "/#for-creators" },
  { label: "About us", href: "/about", isPage: true },
];

export function LandingNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <Link href="/" className="landing-nav-logo" onClick={() => setIsMenuOpen(false)}>
          <Image
            src="/logo/logo-light.png"
            alt="MeroCircle"
            width={36}
            height={36}
            className="landing-nav-logo-img"
          />
          <span className="landing-nav-logo-text">MeroCircle</span>
        </Link>

        <div className="landing-nav-desktop">
          {NAV_LINKS.map((item) =>
            item.isPage ? (
              <Link
                key={item.href}
                href={item.href}
                className="landing-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="landing-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            )
          )}
          <Link href="/auth" className="landing-nav-cta">
            Get Started
          </Link>
        </div>

        <button
          type="button"
          className="landing-nav-mobile-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="landing-nav-mobile-menu">
          {NAV_LINKS.map((item) =>
            item.isPage ? (
              <Link
                key={item.href}
                href={item.href}
                className="landing-nav-mobile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="landing-nav-mobile-link"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            )
          )}
          <Link href="/auth" className="landing-nav-mobile-cta" onClick={() => setIsMenuOpen(false)}>
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
