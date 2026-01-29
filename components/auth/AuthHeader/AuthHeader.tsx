"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import "./AuthHeader.css";

export function AuthHeader() {
  return (
    <header className="auth-header">
      <div className="auth-header-container">
        <Link href="/" className="auth-header-logo">
          <div className="auth-header-icon">
            <Heart className="h-4 w-4 text-white fill-white" />
          </div>
          <span className="auth-header-brand">MeroCircle</span>
        </Link>
      </div>
    </header>
  );
}
