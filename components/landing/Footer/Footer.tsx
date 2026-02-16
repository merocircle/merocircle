"use client";

import Link from "next/link";
import Image from "next/image";
import "./Footer.css";
import { Logo } from '@/components/ui/logo';

export function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        <div className="landing-footer-top">
          <div className="landing-footer-brand">
            <Logo className="w-6 h-6 text-primary object-contain"/>
            <span className="landing-footer-brand-name">MeroCircle</span>
          </div>

          <div className="landing-footer-links">
            <Link href="/about">About</Link>
            <a href="mailto:team@merocircle.app">Contact</a>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} MeroCircle.
            Made with care in Kathmandu.
          </p>
        </div>
      </div>
    </footer>
  );
}
