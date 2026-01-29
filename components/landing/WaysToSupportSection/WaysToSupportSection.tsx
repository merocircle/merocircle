"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { RoundedSection } from "@/components/ui/rounded-section";
import { AnimatedSection } from "@/components/ui/animated-section";
import { Users, Zap, CheckCircle } from "lucide-react";
import "./WaysToSupportSection.css";

export function WaysToSupportSection() {
  return (
    <RoundedSection theme="white" id="ways-to-support">
      <AnimatedSection className="w-full max-w-6xl mx-auto" delay={0.1}>
        <div className="ways-to-support-header">
          <Badge className="mb-4 sm:mb-6 bg-black text-white text-xs" variant="default">
            Ways to Support
          </Badge>
          <h2 className="ways-to-support-title">
            Fund your <span className="text-[#ff4000]">favorite creator</span>
            <br />
            in ways that matter.
          </h2>
          <p className="ways-to-support-description">
            Support creators. Join memberships. Buy their products. It&apos;s easier than you think.
          </p>
        </div>

        <div className="ways-to-support-grid">
          {/* Memberships */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="ways-to-support-card"
          >
            <div className="ways-to-support-card-icon-wrapper ways-to-support-card-icon-purple">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="ways-to-support-card-title">Memberships</h3>
            <p className="ways-to-support-card-description">
              Start a membership for your biggest fans. Earn recurring income by accepting monthly or yearly subscriptions. Share exclusive content and build a loyal community.
            </p>
            <div className="ways-to-support-card-feature">
              <CheckCircle className="w-4 h-4 text-[#ff4000]" />
              <span>Recurring income</span>
            </div>
            <div className="ways-to-support-card-feature">
              <CheckCircle className="w-4 h-4 text-[#ff4000]" />
              <span>Exclusive content</span>
            </div>
          </motion.div>

          {/* Shop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="ways-to-support-card"
          >
            <div className="ways-to-support-card-icon-wrapper ways-to-support-card-icon-teal">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="ways-to-support-card-title">Buy from Creators</h3>
            <p className="ways-to-support-card-description">
              Purchase digital products directly from your favorite creators. Whether it&apos;s an ebook, art commission, exclusive content, or digital artwork, buy what creators have created just for you.
            </p>
            <div className="ways-to-support-card-feature">
              <CheckCircle className="w-4 h-4 text-[#ff4000]" />
              <span>One-tap checkout</span>
            </div>
            <div className="ways-to-support-card-feature">
              <CheckCircle className="w-4 h-4 text-[#ff4000]" />
              <span>Direct from creators</span>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>
    </RoundedSection>
  );
}
