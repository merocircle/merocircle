"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Camera, Sparkles, Play } from "lucide-react";
import "./HeroSection.css";

const HERO_IMAGE = "/MeroCircle_Hero_Oil_Painting.png";

export function HeroSection() {
  return (
    <section className="landing-hero">
      <div className="landing-hero-bg" aria-hidden />
      <div className="landing-hero-grid">
        <div className="landing-hero-content">
          <div className="landing-hero-heading-wrap">
            <h1 className="landing-hero-title">
              YOUR FAVORITE
              <br />
              CREATOR NOW
              <br />
              <span className="landing-hero-title-accent">
                MORE CLOSER
                <svg className="landing-hero-underline" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden>
                  <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="3" />
                </svg>
              </span>
              <br />
              THAN EVER.
            </h1>
            <div className="landing-hero-quote">
              <p className="landing-hero-quote-main">
                The creator who inspires you, deserves your support.
              </p>
              <p className="landing-hero-quote-sub">
                Every like, share, and moment of connection matters. Now you can directly support the creators who bring joy, knowledge, and inspiration to your life. Join their community. Be part of their journey.
              </p>
            </div>
          </div>

          <div className="landing-hero-actions">
            <Link href="/auth" className="landing-hero-cta">
              Start Supporting Creators <ArrowRight size={20} className="landing-hero-cta-icon" />
            </Link>
          </div>
        </div>

        <div className="landing-hero-visual">
          <div className="landing-hero-visual-inner animate-landing-float">
            <div className="landing-hero-glow" aria-hidden />
            <div className="landing-hero-float-camera animate-landing-bounce-slow">
              <Camera className="landing-hero-float-camera-icon" size={40} />
              <span className="landing-hero-float-camera-label">Creation</span>
            </div>
            <div className="landing-hero-float-status animate-landing-float-slow">
              <div className="landing-hero-float-status-dot" />
              <div>
                <p className="landing-hero-float-status-label">Status</p>
                <p className="landing-hero-float-status-value">Directly Connected</p>
              </div>
            </div>

            <div className="landing-hero-image-wrap">
              <div className="landing-hero-frame landing-hero-frame-1" aria-hidden />
              <div className="landing-hero-frame landing-hero-frame-2" aria-hidden />
              <div className="landing-hero-image-container">
                <Image
                  src={HERO_IMAGE}
                  alt="Creator with professional camera - oil painting style"
                  width={560}
                  height={560}
                  className="landing-hero-image"
                  priority
                  sizes="(max-width: 1024px) 100vw, 560px"
                />
                <div className="landing-hero-image-overlay">
                  <div className="landing-hero-image-overlay-content">
                    <div className="landing-hero-play-btn">
                      <Play size={32} className="landing-hero-play-icon" />
                    </div>
                    <div>
                      <p className="landing-hero-overlay-title">A Masterpiece in Progress</p>
                      <p className="landing-hero-overlay-sub">Your support fuels the vision.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="landing-hero-float-sparkles animate-landing-spin-slow">
              <Sparkles className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
