"use client";

import Link from "next/link";
import Script from "next/script";
import { LandingNav, Footer } from "@/components/landing";
import { Target, Users, Rocket, Sprout } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import "./join-us-page.css";

export default function JoinUsPage() {
  return (
    <div className="join-us-page-wrap">
      <LandingNav />
      <main className="join-us-page-content">
        {/* Careers Section */}
        <section className="join-us-form-header-section join-us-hero">
          <div className="join-us-form-header">
            <p className="join-us-form-eyebrow">Careers</p>
            <h2 className="join-us-form-title">Join Our Team</h2>
            <p className="join-us-form-subtitle">
              We're always looking for talented people to join our mission. 
              Fill out the form below and we'll be in touch if there's a good fit.
            </p>
            <button 
              onClick={() => {
                const formSection = document.getElementById('application-form');
                formSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="join-us-cta-button"
            >
              Join Us
            </button>
          </div>
        </section>

        {/* Why Join MeroCircle */}
        <section className="join-us-section">
          <h2 className="join-us-section-title">Why Join MeroCircle?</h2>
          <div className="join-us-section-body">
            <p>
              We're on a mission to create meaningful connections between creators and supporters in Nepal. 
              We believe in building technology that serves people, not algorithms.
            </p>
            <p>
              As part of our team, you'll work on challenging problems that matter. You'll help shape the 
              future of the creator economy in Nepal and build products that thousands of people will use and love.
            </p>
            <p>
              We're a small, passionate team that moves fast and takes ownership. If you're looking to make 
              a real impact and grow with us, we'd love to hear from you.
            </p>
          </div>
        </section>

        {/* About Us Preview */}
        <section className="join-us-about-preview">
          <div className="join-us-about-preview-inner">
            <header className="join-us-about-preview-header">
              <p className="join-us-about-preview-eyebrow">About Us</p>
              <h2 className="join-us-about-preview-title">Building the Future of Creator Support</h2>
              <p className="join-us-about-preview-subtitle">
                We're creating meaningful connections between creators and supporters in Nepal, 
                building technology that serves people rather than algorithms.
              </p>
            </header>
            <div className="join-us-about-preview-content">
              <p>
                MeroCircle started with a simple question: what if supporting your favorite creator 
                was as easy as sending a message? We're building infrastructure for durable connection 
                where creators feel reliably supported and supporters feel genuinely included.
              </p>
              <Link href="/about" className="join-us-about-preview-link">
                Learn More About Our Story
                <svg className="join-us-about-preview-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* What We Believe In */}
        <section className="join-us-values-section">
          <div className="join-us-values-inner">
            <header className="join-us-values-header">
              <p className="join-us-values-eyebrow">Our Values</p>
              <h2 className="join-us-values-title">What We Believe In</h2>
            </header>
            <div className="join-us-values-grid">
              <article className="join-us-value-card">
                <div className="join-us-value-icon">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="join-us-value-title">Mission-Driven</h3>
                <p className="join-us-value-description">
                  We're building something that matters. Every line of code, every design decision, 
                  every conversation serves our mission to connect creators and supporters.
                </p>
              </article>
              
              <article className="join-us-value-card">
                <div className="join-us-value-icon">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="join-us-value-title">User First</h3>
                <p className="join-us-value-description">
                  We obsess over our users. Creators and supporters are at the heart of everything we do. 
                  Their success is our success.
                </p>
              </article>
              
              <article className="join-us-value-card">
                <div className="join-us-value-icon">
                  <Rocket className="h-8 w-8" />
                </div>
                <h3 className="join-us-value-title">Move Fast</h3>
                <p className="join-us-value-description">
                  We're small by design. This means we can move quickly, iterate fast, and make decisions 
                  without bureaucracy. Good ideas win.
                </p>
              </article>
              
              <article className="join-us-value-card">
                <div className="join-us-value-icon">
                  <Sprout className="h-8 w-8" />
                </div>
                <h3 className="join-us-value-title">Grow Together</h3>
                <p className="join-us-value-description">
                  We invest in our team's growth. You'll get mentorship, challenging work, and opportunities 
                  to take on more responsibility as we grow.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Application Form */}
        <section id="application-form" className="join-us-form-section">
          <div className="join-us-form-container">
            <iframe 
              data-tally-src="https://tally.so/embed/eq6Gol?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1" 
              loading="lazy" 
              width="100%" 
              height="1153" 
              frameBorder="0" 
              marginHeight={0} 
              marginWidth={0} 
              title="Join MeroCircle and engage with the biggest creators of Nepal. (Form below ⬇️)"
              className="join-us-tally-form"
            />
          </div>
        </section>
      </main>
      <Footer />
      
      {/* Tally Form Script */}
      <Script 
        src="https://tally.so/widgets/embed.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Load Tally embeds after script loads
          try {
            if ((window as any).Tally) {
              (window as any).Tally.loadEmbeds();
            }
          } catch (error) {
            console.error('Error loading Tally embeds:', error);
          }
        }}
      />
    </div>
  );
}
