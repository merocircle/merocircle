"use client";

import { Badge } from "@/components/ui/badge";
import { RoundedSection } from "@/components/ui/rounded-section";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Shield, Zap, Globe, MessageCircle } from "lucide-react";
import "./TrustSection.css";

const trustFeatures = [
  {
    icon: Shield,
    title: "100% Ownership",
    description: "You have complete ownership of your supporters. We never email them, and you can export your supporter list anytime you like."
  },
  {
    icon: Zap,
    title: "Instant Payments",
    description: "Get paid instantly to your bank account. No more 30-day delays. With eSewa and Khalti, your money reaches you faster."
  },
  {
    icon: Globe,
    title: "Made for Nepal",
    description: "Built specifically for Nepali creators with local payment methods, language support, and understanding of the local creator economy."
  },
  {
    icon: MessageCircle,
    title: "Human Support",
    description: "You get to talk to a real human for help, or if you just like some advice to hit the ground running. We&apos;re here for you."
  }
];

export function TrustSection() {
  return (
    <RoundedSection theme="grey" id="for-creators">
      <AnimatedSection className="w-full max-w-5xl mx-auto" delay={0.1}>
        <div className="trust-section-header">
          <Badge className="mb-4 sm:mb-6 text-xs" variant="outline">
            Built for Creators
          </Badge>
          <h2 className="trust-section-title">
            Designed for creators,
            <br />
            <span className="text-[#ff4000]">not for businesses.</span>
          </h2>
        </div>

        <div className="trust-section-grid">
          {trustFeatures.map((feature, index) => (
            <div key={index} className="trust-feature-card">
              <feature.icon className="trust-feature-icon" />
              <h3 className="trust-feature-title">{feature.title}</h3>
              <p className="trust-feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>
    </RoundedSection>
  );
}
