"use client";

import Image from "next/image";
import { Heart, MessageSquare, Globe, ShieldCheck } from "lucide-react";
import { useReveal } from "../useReveal";
import "./SolutionSection.css";

const NEPAL_IMAGE = "/MeroCircle_Nepal_Concept_Art.png";

const PILLS = [
  { label: "Support", icon: Heart },
  { label: "Connect", icon: MessageSquare },
  { label: "Discover", icon: Globe },
  { label: "Secure", icon: ShieldCheck },
];

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
      className={`solution-reveal ${isVisible ? "solution-reveal-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function SolutionSection() {
  return (
    <section id="how-it-works" className="solution-section">
      <div className="solution-section-inner">
        <RevealSection className="solution-section-content">
          <div className="solution-section-text">
            <p className="solution-section-eyebrow">How It Works</p>
            <h2 className="solution-section-title">
              Creators. Supporters.
              <br />
              Nothing in between.
            </h2>
            <p className="solution-section-description">
              MeroCircle gives you a direct line of access to your favorite creators, with no ads or gatekeepers in the way. Connect more deeply here than anywhere else.
            </p>
            <div className="solution-section-pills">
              {PILLS.map((item) => (
                <div key={item.label} className="solution-section-pill">
                  <div className="solution-section-pill-icon">
                    <item.icon size={18} />
                  </div>
                  <span className="solution-section-pill-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>

        <RevealSection className="solution-section-visual">
          <div className="solution-section-visual-inner">
            <div className="solution-section-image-wrap">
              <Image
                src={NEPAL_IMAGE}
                alt="Abstract geometric art: Himalayan mountains with digital nodes of connection"
                width={600}
                height={600}
                className="solution-section-image"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="solution-section-image-badge">
                <p className="solution-section-badge-eyebrow">Nepal Regional Path</p>
                <p className="solution-section-badge-title">100% Direct access.</p>
              </div>
            </div>
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
