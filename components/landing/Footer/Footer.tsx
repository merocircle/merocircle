"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Share2, Globe, Heart } from "lucide-react";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-bg" aria-hidden />
      <div className="landing-footer-inner">
        <div className="landing-footer-grid">
          <div className="landing-footer-brand-block">
            <div className="landing-footer-brand">
              <Image
                src="/logo/logo-light.png"
                alt="MeroCircle"
                width={36}
                height={36}
                className="landing-footer-logo-img"
              />
              <span className="landing-footer-brand-name">MeroCircle</span>
            </div>
            <p className="landing-footer-tagline">
              Your favorite creator now more closer than ever.
            </p>
            <a
              href="mailto:team@merocircle.app"
              className="landing-footer-contact"
            >
              <Mail size={16} />
              team@merocircle.app
            </a>
            <div className="landing-footer-links-row">
              <Link href="/about" className="landing-footer-link">About us</Link>
              <Link href="/help" className="landing-footer-link">Help Center</Link>
            </div>
            <div className="landing-footer-social">
              <Share2 className="landing-footer-social-icon" size={20} />
              <Globe className="landing-footer-social-icon" size={20} />
              <Heart className="landing-footer-social-icon" size={20} />
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <p className="landing-footer-copyright">
            © 2024 MeroCircle. Built for Nepal&apos;s creative soul.
          </p>
          <div className="landing-footer-legal">
            <Link href="/privacy" className="landing-footer-legal-link">Privacy Policy</Link>
            <span className="landing-footer-legal-link">User Agreement</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
