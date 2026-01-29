"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoundedSection } from "@/components/ui/rounded-section";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Heart, Users, MessageCircle, TrendingUp } from "lucide-react";
import "./ProblemSection.css";

const problemCards = [
  { icon: Heart, title: "Direct Support", description: "Send support directly to creators you love with local payment methods." },
  { icon: Users, title: "Build Community", description: "Join exclusive communities and connect with creators and fellow supporters." },
  { icon: MessageCircle, title: "Stay Connected", description: "Get updates, exclusive content, and meaningful interactions with creators." },
  { icon: TrendingUp, title: "Grow Together", description: "Watch your favorite creators thrive with your support and encouragement." }
];

export function ProblemSection() {
  return (
    <RoundedSection theme="white" id="solutions">
      <AnimatedSection className="w-full max-w-6xl mx-auto" delay={0.1}>
        <div className="problem-section-container">
          <div className="problem-section-content">
            <Badge className="mb-5 sm:mb-7 bg-black text-white text-xs" variant="default">
              Why MeroCircle
            </Badge>
            <h2 className="problem-section-title">
              Support your <span className="text-[#ff4000]">favorite creator</span> directly.
            </h2>
            <p className="problem-section-description">
              No middlemen. No complicated processes. Just you, your favorite creator, and a community built on genuine connection and support.
            </p>
          </div>
          <div className="problem-section-cards">
            {problemCards.map((card, index) => (
              <Card key={index} className="problem-card">
                <CardHeader className="p-6 sm:p-7">
                  <card.icon className="problem-card-icon" />
                  <CardTitle className="problem-card-title">{card.title}</CardTitle>
                  <CardDescription className="problem-card-description">
                    {card.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </AnimatedSection>
    </RoundedSection>
  );
}
