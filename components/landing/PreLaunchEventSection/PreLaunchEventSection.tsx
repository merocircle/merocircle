"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Users, Star, ArrowRight, Sparkles } from "lucide-react";
import { useReveal } from "../useReveal";
import "./PreLaunchEventSection.css";

export function PreLaunchEventSection() {
  const [ref, isVisible] = useReveal();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set target date to 7 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <Users size={16} />,
      title: "Meet the Founders",
      description: "Exclusive Q&A with the creators behind Mero Circle",
    },
    {
      icon: <Star size={16} />,
      title: "Beta Users Only",
      description: "This exclusive event is only available to our beta community",
    },
    {
      icon: <Sparkles size={16} />,
      title: "Early Insights",
      description: "Get sneak peeks at upcoming features and roadmap",
    },
  ];

  return (
    <section className="pre-launch-event" ref={ref}>
      <div className={`pre-launch-event-container ${isVisible ? "pre-launch-visible" : ""}`}>
        {/* Background image with overlay */}
        <div className="pre-launch-background">
          <img 
            src="https://images.unsplash.com/photo-1543286386-713bdd548da4?w=1200&h=600&fit=crop&crop=center"
            alt="Pre-launch event background"
            className="pre-launch-bg-image"
          />
          <div className="pre-launch-overlay" />
        </div>

        {/* Content overlay */}
        <div className="pre-launch-content">
          {/* Title */}
          <h2 className="pre-launch-title">
            Join Our Exclusive
            <br />
            <span className="pre-launch-accent">Pre-Launch Celebration</span>
          </h2>

          {/* Subtitle */}
          <p className="pre-launch-sub">
            Beta users only. Connect with the team and see what's first.
          </p>

          {/* Event details in row */}
          <div className="pre-launch-details-row">
            <div className="detail-item">
              <Calendar size={16} className="detail-icon" />
              <span>Coming Soon</span>
            </div>
          </div>

          {/* Features in row */}
          <div className="pre-launch-features-row">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <div className="feature-content">
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
