"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import "./HeroSection.css";

export function HeroSection() {
  return (
    <section className="hero-section relative bg-[#fafafa] pt-24 pb-12 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
        {/* Mobile Layout: Stacked (Text First, Then Illustration) */}
        <div className="flex flex-col lg:hidden mb-8">
          {/* Text Section - Top on Mobile */}
          <div className="mb-8">
            {/* Large Heading Text */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-6"
            >
              <h1 className="hero-title-mobile">
                <span className="gradient-orange">Your Favorite</span>{" "}
                <span className="gradient-purple">Creator</span>
                <br />
                <span className="text-black/70">now more</span>{" "}
                <span className="gradient-purple">closer</span>
                <br />
                <span className="text-black/70">than</span>{" "}
                <span className="gradient-orange">ever</span>
              </h1>
            </motion.div>

            {/* Small Description Text */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h2 className="hero-subtitle-mobile">
                The creator who inspires you, 
                <br />
                <span className="text-[#ff4000]">deserves your support.</span>
              </h2>
              <p className="hero-description-mobile">
                Every like, share, and moment of connection matters. Now you can directly support the creators who bring joy, knowledge, and inspiration to your life. <span className="text-black font-medium">Join their community. Be part of their journey.</span>
              </p>
            </motion.div>
          </div>

          {/* Illustration - Below Text on Mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
            }}
            transition={{
              opacity: { duration: 0.8, delay: 0.6 },
              y: { duration: 0.8, delay: 0.6 }
            }}
            className="relative w-full h-[400px] sm:h-[500px]"
          >
            <motion.div
              animate={{ 
                y: [0, -15, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5
              }}
              className="relative w-full h-full"
            >
              <Image
                src="/illustration (1).png"
                alt="Creator Illustration"
                fill
                className="object-contain object-center"
                priority
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Desktop Layout: Overlay (Hidden on Mobile) */}
        <div className="hidden lg:block relative h-[650px] mb-8">
          {/* Large Illustration Covering Full Hero - Moving */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, -20, 0],
            }}
            transition={{
              opacity: { duration: 0.8, delay: 0.2 },
              scale: { duration: 0.8, delay: 0.2 },
              y: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }
            }}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
          >
            <div className="relative w-full h-full max-w-[800px]">
              <Image
                src="/illustration (1).png"
                alt="Creator Illustration"
                fill
                className="object-contain object-center"
                priority
              />
            </div>
          </motion.div>

          {/* Left Side: Large Heading Text */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute left-0 top-0 bottom-0 flex items-center z-10 pl-4 lg:pl-12 max-w-[45%]"
          >
            <h1 className="hero-title-desktop">
              <span className="gradient-orange">Your</span>{" "}
              <span className="gradient-orange">Favorite</span>
              <br />
              <span className="gradient-purple">Creator</span>{" "}
              <span className="text-black/70">now</span>
              <br />
              <span className="text-black/70">more</span>{" "}
              <span className="gradient-purple">closer</span>
              <br />
              <span className="text-black/70">than</span>{" "}
              <span className="gradient-orange">ever</span>
            </h1>
          </motion.div>

          {/* Right Side: Small Description Text */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="absolute right-0 top-0 bottom-0 flex flex-col justify-center z-10 pr-4 lg:pr-12 max-w-[380px]"
          >
            <h2 className="hero-subtitle-desktop">
              The creator who inspires you, 
              <br />
              <span className="text-[#ff4000]">deserves your support.</span>
            </h2>
            <p className="hero-description-desktop">
              Every like, share, and moment of connection matters. Now you can directly support the creators who bring joy, knowledge, and inspiration to your life. <span className="text-black font-medium">Join their community. Be part of their journey.</span>
            </p>
          </motion.div>
        </div>

        {/* iPad/Tablet Video Section - Below Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="relative"
        >
          {/* CTA Button Above Tablet */}
          <div className="flex justify-center mb-[-25px] relative z-10">
            <Link href="/auth">
              <Button className="bg-black hover:bg-black/90 text-white px-6 py-3 rounded-full font-medium text-[17px] shadow-2xl">
                Start Supporting Creators
              </Button>
            </Link>
          </div>

          {/* Tablet Container */}
          <div className="backdrop-blur-[2.5px] bg-[rgba(204,204,204,0.2)] p-[26px] rounded-[60px]">
            <div className="relative rounded-[29px] overflow-hidden shadow-[0px_0px_0px_6px_black,0px_50px_48px_0px_rgba(0,0,0,0.59)]">
              {/* iPad Frame */}
              <div className="aspect-[1084/783] bg-gradient-to-br from-gray-100 to-gray-200 relative rounded-[37px] overflow-hidden">
                {/* Screen Content Area */}
                <div className="absolute left-[47px] right-[47px] top-[44px] bottom-[44px] bg-white rounded-lg overflow-hidden">
                  {/* Video Placeholder */}
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <Play className="w-10 h-10 text-orange-500" />
                      </div>
                      <p className="text-gray-600 font-medium">See MeroCircle in Action</p>
                      <p className="text-sm text-gray-500 mt-2">Video placeholder - Add your demo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
