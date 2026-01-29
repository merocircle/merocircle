"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import "./CTASection.css";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

export function CTASection() {
  return (
    <section className="cta-section">
      <div className="cta-section-container">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="cta-section-content"
        >
          <motion.h2 variants={fadeInUp} className="cta-section-title">
            Ready to support your favorite creator?
          </motion.h2>
          <motion.p variants={fadeInUp} className="cta-section-description">
            Join thousands of supporters making a difference in Nepal&apos;s creator community.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link href="/auth">
              <Button 
                size="lg" 
                className="cta-button"
              >
                Start Supporting Creators
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
