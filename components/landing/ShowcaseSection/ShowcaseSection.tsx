"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Video, MessageSquare, Heart, Lock, Send } from "lucide-react";
import { useReveal } from "../useReveal";
import "./ShowcaseSection.css";

export function ShowcaseSection() {
  const [ref, isVisible] = useReveal();

  return (
    <section className="showcase" ref={ref}>
      <div className={`showcase-inner ${isVisible ? "showcase-visible" : ""}`}>

        {/* ═══ FOR CREATORS ═══ */}
        <div className="showcase-audience-label">For Creators</div>

        <h2 className="showcase-title">
          Your community. Your way.
        </h2>
        <p className="showcase-subtitle">
          Build a space where your audience comes to you, not an algorithm.
        </p>

        {/* ── Orbit visualization ── */}
        <div className="orbit-wrap">
          <svg className="orbit-rings" viewBox="0 0 560 560" aria-hidden>
            <circle cx="280" cy="280" r="270" className="orbit-svg-ring orbit-svg-ring-outer" />
            <circle cx="280" cy="280" r="195" className="orbit-svg-ring orbit-svg-ring-mid" />
            <circle cx="280" cy="280" r="120" className="orbit-svg-ring orbit-svg-ring-inner" />
          </svg>

          {/* Center — creator photo */}
          <div className="orbit-center">
            <Image
              src="/illustration (1).png"
              alt="Creator"
              width={140}
              height={140}
              className="orbit-center-img"
            />
            <div className="orbit-live-badge">
              <Video size={11} />
              <span>Live</span>
            </div>
          </div>

          {/* Floating cards */}
          <div className="orbit-card orbit-card-proof orbit-float-1">
            <div className="orbit-card-icon orbit-card-icon-green">
              <Send size={13} />
            </div>
            <div>
              <p className="orbit-card-label">This month</p>
              <p className="orbit-card-value">NPR 125,000</p>
            </div>
          </div>

          <div className="orbit-card orbit-card-revenue orbit-float-2">
            <div className="orbit-avatar-stack">
              <Image src="/illustration (1).png" alt="" width={20} height={20} className="orbit-stack-img" />
              <Image src="/Nishar.jpeg" alt="" width={20} height={20} className="orbit-stack-img" />
              <Image src="/Shaswot Lamichhane.png" alt="" width={20} height={20} className="orbit-stack-img" />
            </div>
            <div>
              <p className="orbit-card-value-sm">Your supporters</p>
            </div>
          </div>

          <div className="orbit-card orbit-card-chat orbit-float-3">
            <div className="orbit-card-icon orbit-card-icon-blue">
              <MessageSquare size={13} />
            </div>
            <div>
              <p className="orbit-card-label">Inner Circle</p>
              <p className="orbit-card-value">Active Now</p>
            </div>
          </div>

          {/* <div className="orbit-card orbit-card-video orbit-float-4">
            <span>New Video 🎬</span>
          </div> */}

          <div className="orbit-pill orbit-pill-heart orbit-float-5">
            <Heart size={14} fill="#ef4444" color="#ef4444" />
          </div>

          <div className="orbit-pill orbit-pill-lock orbit-float-6">
            <Lock size={13} color="#990000" />
          </div>

          <div className="orbit-mini orbit-mini-1">
            <span>New Video 🎬</span>
            {/* <Image src="/Nishar.jpeg" alt="" width={32} height={32} className="orbit-mini-img" /> */}
          </div>
          <div className="orbit-mini orbit-mini-2">
            <Image src="/dodo.png" alt="" width={28} height={28} className="orbit-mini-img" />
          </div>
        </div>

        {/* ── Creator benefits ── */}
        <div className="showcase-benefits">
          <div className="showcase-benefit">
            <span className="showcase-benefit-num">01</span>
            <h3>Your audience, not borrowed.</h3>
            <p>
              On social media, your followers belong to the platform.
              Here, your circle is yours. No algorithm decides who sees your work.
            </p>
          </div>
          <div className="showcase-benefit">
            <span className="showcase-benefit-num">02</span>
            <h3>Not another feed.</h3>
            <p>
              Exclusive posts, private group chats, polls, and live content.
              A real space where your people gather, not just scroll.
            </p>
          </div>
          <div className="showcase-benefit">
            <span className="showcase-benefit-num">03</span>
            <h3>Built where you are.</h3>
            <p>
              eSewa, Khalti, Fonepay. Get paid the way
              Nepal actually works. No workarounds needed.
            </p>
          </div>
        </div>

        <div className="showcase-cta-wrap">
          <Link href="/auth" className="showcase-cta">
            Start Your Circle
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* ═══ FOR SUPPORTERS ═══ */}
        <div className="showcase-divider" />

        <div className="showcase-audience-label showcase-audience-label-alt">For Supporters</div>

        <h2 className="showcase-title">
          Get closer to the people you admire.
        </h2>
        <p className="showcase-subtitle">
          No more watching from a distance. Join their circle and actually be part of it.
        </p>

        <div className="showcase-benefits showcase-benefits-supporter">
          <div className="showcase-benefit">
            <span className="showcase-benefit-num">01</span>
            <h3>See what others can&apos;t.</h3>
            <p>
              Exclusive posts, behind-the-scenes content, and early
              access. The stuff that never makes it to social media.
            </p>
          </div>
          <div className="showcase-benefit">
            <span className="showcase-benefit-num">02</span>
            <h3>Actually talk to them.</h3>
            <p>
              Private chats, group conversations, and direct replies.
              Not a comment lost in a sea of thousands.
            </p>
          </div>
          <div className="showcase-benefit">
            <span className="showcase-benefit-num">03</span>
            <h3>Support that means something.</h3>
            <p>
              Your contribution goes directly to the creator.
              You&apos;re not just a follower. You&apos;re part of their journey.
            </p>
          </div>
        </div>

        <div className="showcase-cta-wrap">
          <Link href="/auth" className="showcase-cta">
            Find Your Creator
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
