"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { RoundedSection } from "@/components/ui/rounded-section";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Heart, Users, Globe, Shield } from "lucide-react";
import "./SolutionSection.css";

const solutionItems = [
  { icon: Heart, title: "Support" },
  { icon: Users, title: "Connect" },
  { icon: Globe, title: "Discover" },
  { icon: Shield, title: "Secure" },
];

export function SolutionSection() {
  return (
    <RoundedSection theme="white">
      <AnimatedSection className="w-full max-w-5xl mx-auto text-center" delay={0.1}>
        <Badge className="mb-4 sm:mb-6 bg-black text-white text-xs" variant="default">
          How It Works
        </Badge>
        <h2 className="solution-section-title">
          Creators. Supporters. <br />
          <span className="text-[#ff4000]">Nothing in between.</span>
        </h2>
        <p className="solution-section-description">
          MeroCircle gives you a direct line of access to your favorite creators, with no ads or gatekeepers in the way. Through real-time connections, comments, and direct support, you can connect more deeply with creators here than anywhere else.
        </p>
        <div className="solution-section-grid">
          {solutionItems.map((item, index) => (
            <motion.div 
              key={index} 
              className="solution-item"
              whileHover={{ y: -10 }} 
              whileTap={{ scale: 0.95 }}
            >
              <div className="solution-item-icon-wrapper">
                <item.icon className="solution-item-icon" />
              </div>
              <h3 className="solution-item-title">{item.title}</h3>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>
    </RoundedSection>
  );
}
