"use client";

import Image from "next/image";
import { useReveal } from "../useReveal";
import "./TeamSection.css";

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
      className={`team-reveal ${isVisible ? "team-reveal-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

const TEAM = [
  {
    name: "Shaswot Lamichhane",
    role: "CEO & Cofounder",
    current: "Special Project Lead @ Tools for Humanity",
    image: "/Shaswot Lamichhane.png",
    words:
      "We built MeroCircle because creators in Nepal deserve a direct line to their supporters. No algorithms, no middlemen. Every like and share should turn into real support. This is our way of backing the people who make the content we love.",
  },
  {
    name: "Nishar Miya",
    role: "CTO & Cofounder",
    current: "AI Engineer @ Dayos",
    image: "/Nishar.jpeg",
    words:
      "It started with a simple question: what if supporting your favorite creator was as easy as sending a message? We wanted a place where creators and supporters meet directly. MeroCircle is that bridge, built for Nepal, from the ground up.",
  },
  {
    name: "Kritish Dhakal",
    role: "UI/UX Developer",
    current: "",
    image: null as string | null,
    words:
      "As the UI/UX designer, my focus is on making every tap and scroll feel intentional. MeroCircle should feel like a quiet room where connection happens. Clear, calm, and without the noise of feeds or algorithms. We're designing for the moment a supporter decides to give, and for the creator who receives it. That moment deserves a clear path and zero friction.",
    isPlaceholder: true,
  },
];

export function TeamSection() {
  return (
    <section id="team" className="team-section">
      <div className="team-section-inner">
        <RevealSection className="team-section-header">
          <p className="team-section-eyebrow">The Team</p>
          <h2 className="team-section-title">People behind MeroCircle</h2>
          <p className="team-section-description">
            We’re builders and believers in a creator economy that puts creators and supporters first.
          </p>
        </RevealSection>

        <div className="team-section-grid">
          {TEAM.map((member, i) => (
            <RevealSection key={member.name} className={`team-card-wrap team-card-delay-${i}`}>
              <article className={`team-card ${member.isPlaceholder ? "team-card-placeholder" : ""}`}>
                <div className="team-card-image-wrap">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={280}
                      height={280}
                      className="team-card-image"
                      sizes="(max-width: 768px) 100vw, 280px"
                    />
                  ) : (
                    <div className="team-card-image team-card-image-placeholder">
                      <span className="team-card-placeholder-initials">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                  )}
                </div>
                <div className="team-card-body">
                  <h3 className="team-card-name">{member.name}</h3>
                  <p className="team-card-role">{member.role}</p>
                  {member.current && (
                    <p className="team-card-current">{member.current}</p>
                  )}
                  <blockquote className="team-card-words">&ldquo;{member.words}&rdquo;</blockquote>
                </div>
              </article>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}
