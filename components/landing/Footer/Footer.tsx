"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer-container">
        <div className="landing-footer-grid">
          <div>
            <div className="landing-footer-brand">
              <div className="landing-footer-logo">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="landing-footer-brand-name">MeroCircle</h3>
            </div>
            <p className="landing-footer-tagline">
              On Demand Creator Platform,
              <br />
              Delivered Overnight.
            </p>
          </div>
          
          <div>
            <h4 className="landing-footer-heading">Company</h4>
            <ul className="landing-footer-links">
              <li><Link href="/auth" className="landing-footer-link">About us</Link></li>
              <li><Link href="/home" className="landing-footer-link">Pricing</Link></li>
              <li><Link href="/help" className="landing-footer-link">Security</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="landing-footer-heading">Support</h4>
            <ul className="landing-footer-links">
              <li><Link href="/help" className="landing-footer-link">Help Center</Link></li>
              <li><Link href="/contact" className="landing-footer-link">Contact</Link></li>
              <li><Link href="/terms" className="landing-footer-link">Terms</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="landing-footer-bottom">
          <p className="landing-footer-copyright">
            © 2024 MeroCircle. Made with ❤️ for Nepal&apos;s creative community.
          </p>
        </div>
      </div>
    </footer>
  );
}
