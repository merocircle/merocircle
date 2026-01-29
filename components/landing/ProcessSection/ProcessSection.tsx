"use client";

import { Badge } from "@/components/ui/badge";
import { RoundedSection } from "@/components/ui/rounded-section";
import { AnimatedSection } from "@/components/ui/animated-section";
import { ArrowRight } from "lucide-react";
import "./ProcessSection.css";

const processSteps = [
  { step: "01", title: "Find Creators", desc: "Discover amazing creators from Nepal across different categories and interests." },
  { step: "02", title: "Join Communities", desc: "Become part of exclusive communities and connect with like-minded supporters." },
  { step: "03", title: "Show Support", desc: "Support creators directly using eSewa or Khalti - Nepal&apos;s trusted payment methods." },
  { step: "04", title: "Stay Connected", desc: "Get updates, exclusive content, and meaningful interactions with your favorite creators." },
  { step: "05", title: "Grow Together", desc: "Watch creators thrive and communities flourish with your support and engagement." }
];

export function ProcessSection() {
  return (
    <RoundedSection theme="grey" id="process">
      <AnimatedSection className="w-full max-w-6xl mx-auto" delay={0.1}>
        <div className="process-section-container">
          <div className="process-section-content">
            <Badge className="mb-4 sm:mb-6 text-xs" variant="outline">
              Get Started
            </Badge>
            <h2 className="process-section-title">
              Join the <br /> community <br /> today.
            </h2>
            <p className="process-section-description">
              Start supporting your favorite creators or build your own community. It&apos;s simple, secure, and built for Nepal.
            </p>
          </div>
          <div className="process-section-steps">
            {processSteps.map((item, index) => (
              <div key={index} className="process-step-card">
                <div className="process-step-number">{item.step}</div>
                <div className="process-step-content">
                  <h3 className="process-step-title">{item.title}</h3>
                  <p className="process-step-description">{item.desc}</p>
                </div>
                <ArrowRight className="process-step-arrow" />
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>
    </RoundedSection>
  );
}
