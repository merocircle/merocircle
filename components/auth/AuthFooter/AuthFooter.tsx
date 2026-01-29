"use client";

import { Heart } from "lucide-react";
import "./AuthFooter.css";

const currentYear = new Date().getFullYear();

export function AuthFooter() {
  return (
    <footer className="auth-footer">
      <div className="auth-footer-container">
        <p className="auth-footer-text">
          &copy; {currentYear} MeroCircle. Made with{' '}
          <Heart className="auth-footer-heart" /> in Nepal
        </p>
      </div>
    </footer>
  );
}
