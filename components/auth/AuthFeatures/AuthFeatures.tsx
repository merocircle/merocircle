"use client";

import { motion } from "framer-motion";
import { Sparkles, Users, MessageCircle } from "lucide-react";
import "./AuthFeatures.css";

const features = [
  { icon: Sparkles, label: "Support Creators" },
  { icon: Users, label: "Join Community" },
  { icon: MessageCircle, label: "Exclusive Content" },
];

export function AuthFeatures() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="auth-features"
    >
      {features.map((feature, index) => (
        <div key={index} className="auth-feature-item">
          <div className="auth-feature-icon">
            <feature.icon className="h-5 w-5" />
          </div>
          <p className="auth-feature-label">{feature.label}</p>
        </div>
      ))}
    </motion.div>
  );
}
