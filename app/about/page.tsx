"use client";

import Image from "next/image";
import Link from "next/link";
import { LandingNav } from "@/components/landing";
import "./about-page.css";

const TEAM = [
  {
    name: "Shaswot Lamichhane",
    role: "CEO & Cofounder",
    current: "Special Project Lead @ Tools for Humanity",
    image: "/Shaswot Lamichhane.png",
    words:
      "We built MeroCircle because creators in Nepal deserve a direct line to their supporters—no algorithms, no middlemen. Every like and share should turn into real support. This is our way of backing the people who make the content we love.",
  },
  {
    name: "Nishar Miya",
    role: "CTO & Cofounder",
    current: "AI Engineer @ Dayos",
    image: "/Nishar.jpeg",
    words:
      "It started with a simple question: what if supporting your favorite creator was as easy as sending a message? We wanted a place where creators and supporters meet directly. MeroCircle is that bridge—built for Nepal, from the ground up.",
  },
  {
    name: "Kritish Dhakal",
    role: "UI/UX Developer",
    current: "—",
    image: null as string | null,
    words:
      "As the UI/UX designer, my focus is on making every tap and scroll feel intentional. MeroCircle should feel like a quiet room where connection happens—clear, calm, and without the noise of feeds or algorithms. We're designing for the moment a supporter decides to give, and for the creator who receives it. That moment deserves a clear path and zero friction.",
    isPlaceholder: true,
  },
];

export default function AboutPage() {
  return (
    <div className="about-page-wrap">
      <LandingNav />
      <main className="about-page-content">
        {/* Hero: logo + name + tagline */}
        <header className="about-hero">
          <Link href="/" className="about-hero-brand">
            <Image
              src="/logo/logo-light.png"
              alt=""
              width={80}
              height={80}
              className="about-hero-logo"
            />
            <span className="about-hero-name">MeroCircle</span>
          </Link>
          <p className="about-hero-tagline">
            Your favorite creator now more closer than ever.
          </p>
        </header>

        {/* What is MeroCircle */}
        <section className="about-section">
          <h2 className="about-section-title">What is MeroCircle?</h2>
          <div className="about-section-body">
            <p>
              MeroCircle is a place where creators and their supporters connect directly—no algorithms, no feeds built for attention. We believe connection is built through access, recognition, and consistency, not through likes and scroll.
            </p>
            <p>
              Think of it like a private room with a creator: people who genuinely care can gather, talk, and support, and creators can show up without performing for an algorithm. When supporters feel included and creators feel reliably supported, real value flows naturally.
            </p>
          </div>
        </section>

        {/* Why we built this */}
        <section className="about-section">
          <h2 className="about-section-title">Why we built this</h2>
          <div className="about-section-body">
            <p>
              Social media maximizes for attention, not connection. We built MeroCircle because creators in Nepal—and everywhere—deserve a direct line to their supporters. We're not trying to build a complete platform overnight; we're building a small system that works: simple, focused, and human.
            </p>
            <p>
              Our principle: every feature should strengthen the feeling of connection or make supporting a creator feel more valuable. We're here to protect simplicity and perfect the details that matter.
            </p>
          </div>
        </section>

        {/* Team */}
        <section className="about-team" id="team">
          <div className="about-team-inner">
            <header className="about-team-header">
              <p className="about-team-eyebrow">The Team</p>
              <h2 className="about-team-title">People behind MeroCircle</h2>
            </header>
            <div className="about-team-grid">
              {TEAM.map((member) => (
                <article
                  key={member.name}
                  className={`about-team-card ${member.isPlaceholder ? "about-team-card-placeholder" : ""}`}
                >
                  <div className="about-team-card-image-wrap">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={280}
                        height={280}
                        className="about-team-card-image"
                        sizes="(max-width: 768px) 100vw, 280px"
                      />
                    ) : (
                      <div className="about-team-card-image-placeholder">
                        <span className="about-team-card-initials">
                          {member.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="about-team-card-body">
                    <h3 className="about-team-card-name">{member.name}</h3>
                    <p className="about-team-card-role">{member.role}</p>
                    {member.current !== "—" && (
                      <p className="about-team-card-current">{member.current}</p>
                    )}
                    <blockquote className="about-team-card-words">
                      &ldquo;{member.words}&rdquo;
                    </blockquote>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
