"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import "./AuthHero.css";

export function AuthHero() {
  return (
    <div className="auth-hero">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="auth-hero-logo"
      >
        <div className="auth-hero-logo-inner">
          <Heart className="h-8 w-8 text-white fill-white" />
        </div>
      </motion.div>

      <h1 className="auth-hero-title">
        Welcome to MeroCircle
      </h1>
      <p className="auth-hero-subtitle">
        Nepal&apos;s creator community platform
      </p>
    </div>
  );
}
