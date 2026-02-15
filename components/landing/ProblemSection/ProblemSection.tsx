"use client";

import { Wallet, Users, Sparkles, Globe } from "lucide-react";
import { useReveal } from "../useReveal";
import "./ProblemSection.css";

function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [ref, isVisible] = useReveal();
  return (
    <div
      ref={ref}
      className={`problem-reveal ${isVisible ? "problem-reveal-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

const CARDS = [
  {
    title: "Direct Support",
    desc: "Send support directly to creators you love with local payment methods.",
    icon: Wallet,
  },
  {
    title: "Build Community",
    desc: "Join exclusive communities and connect with creators and fellow supporters.",
    icon: Users,
  },
  {
    title: "Stay Connected",
    desc: "Get updates, exclusive content, and meaningful interactions with creators.",
    icon: Sparkles,
  },
  {
    title: "Grow Together",
    desc: "Watch your favorite creators thrive with your support and encouragement.",
    icon: Globe,
  },
];

export function ProblemSection() {
  return (
    <section id="why-merocircle" className="problem-section">
      <div className="problem-section-inner">
        <RevealSection className="problem-section-header">
          <p className="problem-section-eyebrow">Why MeroCircle</p>
          <h2 className="problem-section-title">
            Support your favorite creator directly.
          </h2>
          <p className="problem-section-description">
            No middlemen. No complicated processes. Just you, your favorite creator, and a community built on genuine connection and support.
          </p>
        </RevealSection>

        <div className="problem-section-grid">
          {CARDS.map((item, i) => (
            <RevealSection key={item.title} className={`problem-section-card-wrap problem-section-card-delay-${i}`}>
              <div className="problem-section-card">
                <div className="problem-section-card-corner" aria-hidden />
                <div className="problem-section-card-icon">
                  <item.icon size={24} />
                </div>
                <h3 className="problem-section-card-title">{item.title}</h3>
                <p className="problem-section-card-desc">{item.desc}</p>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}
