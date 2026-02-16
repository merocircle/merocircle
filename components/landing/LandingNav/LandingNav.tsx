"use client";

import Link from "next/link";
import Image from "next/image";
import "./LandingNav.css";

import { Logo } from '@/components/ui/logo';

export function LandingNav() {
  return (
    <nav className="landing-nav">
      <div className="landing-nav-inner">
        <Link href="/" className="landing-nav-logo">
          <Logo className="w-6 h-6 text-primary object-contain"/>
          <span className="landing-nav-logo-text">MeroCircle</span>
          <span className="ml-2 text-[9px] font-bold tracking-[0.15em] uppercase px-2 py-0.5 rounded-full border border-primary/40 text-primary bg-primary/5 animate-pulse">
            BETA
          </span>
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
