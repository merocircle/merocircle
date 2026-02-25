"use client";

import Image from "next/image";
import Link from "next/link";
import { LandingNav } from "@/components/landing";
import "./about-page.css";

import { Logo } from "@/components/ui/logo";

const TEAM = [
  {
    name: "Shaswot Lamichhane",
    role: "CEO & Cofounder",
    // current: "Special Project Lead @ Tools for Humanity",
    image: "/Shaswot Lamichhane.png",
    words:
      "Shaswot works at the intersection of technology and community. He has been involved in digital identity and coordination initiatives, including work connected with Tools for Humanity.",
  },
  {
    name: "Nishar Miya",
    role: "CTO & Cofounder",
    // current: "AI Engineer @ Dayos",
    image: "/Nishar.jpeg",
    words:
      "It started with a simple question: what if supporting your favorite creator was as easy as sending a message? We wanted a place where creators and supporters meet directly. MeroCircle is that bridge—built for Nepal, from the ground up.",
  },
  {
    name: "Kritish Dhakal",
    role: "UI/UX Developer",
    // current: "—",
    image: null as string | null,
    words:
      "Kritish is a UI/UX developer working at the crossroads of design and technology. He has contributed to interactive web projects and community-led creative initiatives, shaping experiences that connect people and ideas.",
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
            <Logo className="w-6 h-6 text-primary object-contain" />
            <span className="about-hero-name">MeroCircle</span>
          </Link>
          <p className="about-hero-tagline">
            Your favorite creator, closer than ever.
          </p>
        </header>

        {/* What is MeroCircle */}
        <section className="about-section">
          <h2 className="about-section-title">What is MeroCircle?</h2>
          <div className="about-section-body">
            <p>
              We want to create real connection between creators and supporters
              that lasts.
            </p>
            <p>
              Most social platforms nowadays optimize for attention and have
              lost the meaning of “social”. More posts. More reach. More
              engagement. Activity is treated as value. Over time, that creates
              noise instead of closeness.
            </p>
            <p>
              We believe connection is built through access, recognition, and
              consistency. Mero Circle is a private space around a creator. A
              place where people who genuinely care can gather, participate, and
              stay connected without performing for an algorithm.
            </p>
            <p>
              It is a small, intentional system designed to turn audiences into
              real communities.
            </p>
          </div>
        </section>

        {/* Why we built this */}
        <section className="about-section">
          <h2 className="about-section-title">Why we built this</h2>
          <div className="about-section-body">
            <p>
              We kept seeing the same pattern. Creators were visible everywhere
              but disconnected from the people who supported them. Supporters
              were engaged but distant. Numbers replaced relationships.
            </p>
            <p>
              We built Mero Circle to create infrastructure for durable connection. When supporters feel included and creators feel reliably supported, value follows naturally.
            </p>
            <p>
              We are building carefully. Some ideas will evolve. Some decisions are locked. Our focus is simple. Build a system that works under real conditions. Limited attention. Conservative users. Creators who want support without friction.
            </p>
            <p>
              Every feature must strengthen connection or make support more valuable. If it does not, it does not belong.
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
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="about-team-card-body">
                    <h3 className="about-team-card-name">{member.name}</h3>
                    <p className="about-team-card-role">{member.role}</p>
                    {member.current !== "—" && (
                      <p className="about-team-card-current">
                        {member.current}
                      </p>
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
