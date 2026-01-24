"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useInView, useScroll, useTransform, useAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Star,
  Coffee,
  Play,
  CheckCircle,
  ArrowDown,
  MessageCircle,
  Clock,
  Sparkles,
  Bookmark,
  Lightbulb,
  Calendar,
  Target,
  Award,
} from "lucide-react";
import { Header } from "@/components/header";
import { useAuth } from "@/contexts/supabase-auth-context";
import { logger } from "@/lib/logger";
import Image from "next/image";

// Animation variants
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

// Hero stats data
const heroStats = [
  { value: "5K+", label: "Nepal Creators", icon: Users },
  { value: "₹2M+", label: "Creator Earnings", icon: TrendingUp },
  { value: "50K+", label: "Active Supporters", icon: Heart },
  { value: "99.9%", label: "Uptime", icon: Shield },
];

// Features data
const features = [
  {
    icon: Heart,
    title: "Local Payment Solutions",
    description: "Seamlessly receive payments through eSewa and Khalti - Nepal's most trusted payment gateways.",
  },
  {
    icon: Users,
    title: "Build Your Community",
    description: "Connect with supporters, share exclusive content, and build lasting relationships with your audience.",
  },
  {
    icon: TrendingUp,
    title: "Analytics & Insights",
    description: "Track your growth with detailed analytics, revenue insights, and audience engagement metrics.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Your data and transactions are protected with bank-grade security and 99.9% uptime guarantee.",
  },
  {
    icon: Zap,
    title: "Quick Setup",
    description: "Get started in minutes. Set up your creator profile and start receiving support immediately.",
  },
  {
    icon: Globe,
    title: "Made for Nepal",
    description: "Built specifically for Nepali creators with local language support and cultural understanding.",
  }
];

// Testimonials data
const testimonials = [
  {
    name: "Priya Sharma",
    role: "Digital Artist",
    content: "MeroCircle transformed my art journey. Local payments made it so easy for my supporters!",
    avatar: "PS",
    rating: 5,
  },
  {
    name: "Raj Gurung",
    role: "Content Creator",
    content: "The community features are amazing. I can connect with my audience like never before.",
    avatar: "RG",
    rating: 5,
  },
  {
    name: "Maya Thapa",
    role: "Writer",
    content: "Finally, a platform that understands Nepali creators. The analytics help me grow better.",
    avatar: "MT",
    rating: 5,
  }
];

export default function LandingPage() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const testimonialsRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const isFeaturesInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const isTestimonialsInView = useInView(testimonialsRef, { once: true, margin: "-100px" });
  const controls = useAnimation();
  const [urlMessage, setUrlMessage] = useState<string | null>(null);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    if (isHeroInView) {
      controls.start("visible");
    }
    
    // Check for URL messages
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');
    if (message) {
      setUrlMessage(message);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isHeroInView, controls]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isAuthenticated) {
        logger.debug('Redirecting to dashboard after timeout', 'LANDING_PAGE');
        router.push('/dashboard');
      }
    }, 3000);

    if (!loading && isAuthenticated) {
      clearTimeout(timeoutId);
      router.push('/dashboard');
    }

    return () => clearTimeout(timeoutId);
  }, [loading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950">
      <Header />
      
      {/* URL Message Display */}
      {urlMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {urlMessage === 'auth_required' && 'Please complete authentication'}
                  {urlMessage !== 'auth_required' && urlMessage}
                </p>
                {urlMessage === 'auth_required' && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                    Check browser console for detailed logs
                  </p>
                )}
              </div>
              <button
                onClick={() => setUrlMessage(null)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                ×
              </button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Hero Section - Overlay Layout (Desktop) / Stacked Layout (Mobile) */}
      <section className="relative bg-[#fafafa] dark:bg-gray-950 pt-24 pb-12 overflow-hidden">
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
                <h1 className="text-[42px] sm:text-[56px] font-bold leading-[1.1] tracking-[-2px] text-black dark:text-white">
                  Your
                  <br />
                  Creator&apos;s
                  <br />
                  Next
                  <br />
                  10 Years
                  <br />
                  of
                  <br />
                  Growth<span className="text-[#ff4000]">.</span>
                </h1>
              </motion.div>

              {/* Small Description Text */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <h2 className="text-[15px] font-semibold leading-[1.5] tracking-[-0.3px] text-black dark:text-white mb-4">
                  Nepal&apos;s Creative Economy Is Ready for Tomorrow&apos;s Tools — 
                  <span className="text-[#ff4000]"> Launch in a Week.</span>
                </h2>
                <p className="text-[14px] leading-[1.5] text-black/70 dark:text-white/70">
                  Ditch spreadsheets and complicated platforms. You explain your vision, MeroCircle provides the tools, and <span className="text-black dark:text-white font-medium">you launch your creator business in days</span>.
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
              <div className="relative w-full h-full max-w-[900px]">
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
              className="absolute left-0 top-0 bottom-0 flex items-center z-10 pl-4 lg:pl-12"
            >
              <h1 className="text-[64px] lg:text-[80px] xl:text-[96px] font-bold leading-[1.05] tracking-[-3px] text-black dark:text-white">
                Your
                <br />
                Creator&apos;s
                <br />
                Next
                <br />
                10 Years
                <br />
                of
                <br />
                Growth<span className="text-[#ff4000]">.</span>
              </h1>
            </motion.div>

            {/* Right Side: Small Description Text */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute right-0 top-0 bottom-0 flex flex-col justify-center z-10 pr-4 lg:pr-12 max-w-[380px]"
            >
              <h2 className="text-[15px] lg:text-[16px] font-semibold leading-[1.5] tracking-[-0.3px] text-black dark:text-white mb-6">
                Nepal&apos;s Creative Economy Is Ready for Tomorrow&apos;s Tools — 
                <span className="text-[#ff4000]"> Launch in a Week.</span>
              </h2>
              <p className="text-[13px] lg:text-[14px] leading-[1.5] text-black/70 dark:text-white/70">
                Ditch spreadsheets and complicated platforms. You explain your vision, MeroCircle provides the tools, and <span className="text-black dark:text-white font-medium">you launch your creator business in days</span>.
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
                  Start Your Creator Journey
                </Button>
              </Link>
            </div>

            {/* Tablet Container */}
            <div className="backdrop-blur-[2.5px] bg-[rgba(204,204,204,0.2)] dark:bg-[rgba(50,50,50,0.3)] p-[26px] rounded-[60px]">
              <div className="relative rounded-[29px] overflow-hidden shadow-[0px_0px_0px_6px_black,0px_50px_48px_0px_rgba(0,0,0,0.59)]">
                {/* iPad Frame */}
                <div className="aspect-[1084/783] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 relative rounded-[37px] overflow-hidden">
                  {/* Screen Content Area */}
                  <div className="absolute left-[47px] right-[47px] top-[44px] bottom-[44px] bg-white dark:bg-gray-950 rounded-lg overflow-hidden">
                    {/* Video Placeholder */}
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                          <Play className="w-10 h-10 text-orange-500" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">See MeroCircle in Action</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Video placeholder - Add your demo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-[1200px] mx-auto px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-12"
          >
            {heroStats.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="text-[48px] md:text-[58px] font-bold text-black dark:text-white mb-2 leading-none tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[14px] text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Meet MeroCircle Section */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-[1000px] mx-auto px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-4"
          >
            <motion.h2 variants={fadeInUp} className="text-[48px] md:text-[58px] font-bold text-black dark:text-white leading-tight tracking-tight">
              Meet MeroCircle
            </motion.h2>
            <motion.h3 variants={fadeInUp} className="text-[48px] md:text-[58px] font-bold text-black dark:text-white leading-tight tracking-tight">
              Your On Demand
            </motion.h3>
            <motion.h3 variants={fadeInUp} className="text-[48px] md:text-[58px] font-bold text-black dark:text-white leading-tight tracking-tight">
              Creator Platform,
            </motion.h3>
            <motion.h3 variants={fadeInUp} className="text-[48px] md:text-[58px] font-bold text-black dark:text-white leading-tight tracking-tight">
              Delivered Overnight<span className="text-[#ff4000]">.</span>
            </motion.h3>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-[800px] mx-auto px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <div className="border-2 border-black/10 dark:border-white/10 rounded-lg p-8 mb-8">
              <p className="text-[16px] md:text-[18px] text-black/80 dark:text-white/80 leading-relaxed">
                Not another rip-and-replace nightmare. MeroCircle works alongside your existing tools, fixing your biggest pain first—whether that&apos;s local payments, community chaos, or content monetization. Start small, prove value, expand when ready.
              </p>
            </div>
            <h3 className="text-[38px] md:text-[48px] font-bold text-black dark:text-white mb-4 leading-tight tracking-tight">
              One truth everyone actually trusts:
            </h3>
            <p className="text-[16px] text-black/70 dark:text-white/70 leading-relaxed max-w-xl mx-auto">
              Your social media stays running. Your content keeps flowing. MeroCircle connects them all. Or retires them. Your choice.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tabbed Features Section */}
      <section ref={featuresRef} className="py-20 bg-[#fafafa] dark:bg-gray-900">
        <div className="max-w-[1100px] mx-auto px-8">
          {/* Tabs */}
          <div className="border-b-2 border-black/10 dark:border-white/10 mb-8">
            <div className="flex gap-0">
              <div className="px-7 py-3 border-b-2 border-black dark:border-white">
                <span className="text-[15px] font-medium text-black dark:text-white">Community Building</span>
              </div>
              <div className="px-7 py-3 border-b-2 border-transparent opacity-50">
                <span className="text-[15px] font-medium text-black dark:text-white">Payment Solutions</span>
              </div>
              <div className="px-7 py-3 border-b-2 border-transparent opacity-50">
                <span className="text-[15px] font-medium text-black dark:text-white">Analytics & Growth</span>
              </div>
              <div className="px-7 py-3 border-b-2 border-transparent opacity-50">
                <span className="text-[15px] font-medium text-black dark:text-white">Creator Tools</span>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="border-2 border-black/10 dark:border-white/10 rounded-lg p-8">
            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-12 items-center">
              {/* Left: Text Content */}
              <div className="space-y-8 border-r-2 border-black/10 dark:border-white/10 pr-8">
                <div className="space-y-4">
                  <h3 className="text-[38px] md:text-[48px] font-bold text-black dark:text-white leading-tight tracking-tight">
                    No complex dashboards—just your community
                  </h3>
                  <p className="text-[16px] text-black/60 dark:text-white/60 leading-relaxed">
                    Most creators get started in ~15 minutes.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-[18px] font-semibold text-black dark:text-white">
                      &quot;Just Show Me My Supporters&quot;
                    </h4>
                    <p className="text-[14px] text-black/60 dark:text-white/60 leading-relaxed">
                      Clear supporter lists, direct messaging that works. Real-time notifications that make sense. No hunting through three apps or complicated creator portals.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[18px] font-semibold text-black dark:text-white">
                      Your Content, Your Way
                    </h4>
                    <p className="text-[14px] text-black/60 dark:text-white/60 leading-relaxed">
                      Share updates that actually reach your supporters. Post exclusive content without learning complex systems. Build relationships without drowning in features.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: iPad Mockup */}
              <div className="relative">
                <div className="aspect-[540/600] border-2 border-black/10 dark:border-white/10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4 overflow-hidden">
                  <div className="w-full h-full bg-white dark:bg-gray-950 rounded-md flex items-center justify-center">
                    <div className="text-center p-8">
                      <Users className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Community Dashboard Preview</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <Badge className="px-4 py-2 bg-white dark:bg-gray-950 border-2 border-black dark:border-white text-black dark:text-white text-[16px] font-medium rounded-full">
                Built for Nepali Creators
              </Badge>
            </div>
            <h2 className="text-[38px] md:text-[48px] font-bold text-black dark:text-white mb-4 leading-tight tracking-tight">
              Conventional Platforms, MES/ERP/etc
              <br />
              force you to ignore the 5% edge cases—or patch
              <br />
              with spreadsheets.
            </h2>
            <p className="text-[16px] text-black/70 dark:text-white/70 leading-relaxed max-w-3xl mx-auto">
              But Your Edge Cases ARE YOUR BUSINESS. MeroCircle makes them standard work.
            </p>
            <div className="mt-8">
              <Link href="/auth">
                <Button className="bg-black hover:bg-black/90 text-white px-8 py-4 rounded-full font-medium text-[17px]">
                  Start Your Creator Journey
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="space-y-8">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border-2 border-black/10 dark:border-white/10 rounded-lg overflow-hidden"
            >
              {/* Tab Header */}
              <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-b-2 border-black/10 dark:border-white/10">
                <span className="text-[14px] font-semibold text-black dark:text-white uppercase tracking-wide">Local Payments</span>
              </div>
              
              {/* Card Content */}
              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-[24px] font-bold text-black dark:text-white">Today</h3>
                  <p className="text-[16px] text-black/70 dark:text-white/70 leading-relaxed">
                    International payment processors charge high fees and don&apos;t support local currencies well. Supporters can&apos;t easily send support. You lose money on conversions.
                  </p>
                </div>
                
                <div className="border-t-2 border-black/10 dark:border-white/10 pt-6 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                      With MeroCircle
                    </div>
                  </div>
                  <p className="text-[16px] text-black/70 dark:text-white/70 leading-relaxed">
                    Direct integration with eSewa and Khalti. Your supporters pay using methods they already trust. Zero conversion fees. Instant settlements in NPR.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border-2 border-black/10 dark:border-white/10 rounded-lg overflow-hidden"
            >
              <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-b-2 border-black/10 dark:border-white/10">
                <span className="text-[14px] font-semibold text-black dark:text-white uppercase tracking-wide">Community</span>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-[24px] font-bold text-black dark:text-white">Today</h3>
                  <p className="text-[16px] text-black/70 dark:text-white/70 leading-relaxed">
                    Managing supporters across multiple platforms. Messages get lost. Updates don&apos;t reach everyone. Engagement metrics are scattered.
                  </p>
                </div>
                
                <div className="border-t-2 border-black/10 dark:border-white/10 pt-6 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                      With MeroCircle
                    </div>
                  </div>
                  <p className="text-[16px] text-black/70 dark:text-white/70 leading-relaxed">
                    One dashboard for all your supporters. Direct messaging that works. Exclusive content delivery that reaches 100% of your community. Clean engagement data.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="border-2 border-black/10 dark:border-white/10 rounded-lg overflow-hidden"
            >
              <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-b-2 border-black/10 dark:border-white/10">
                <span className="text-[14px] font-semibold text-black dark:text-white uppercase tracking-wide">Analytics</span>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-[24px] font-bold text-black dark:text-white">Today</h3>
                  <p className="text-[16px] text-black/70 dark:text-white/70 leading-relaxed">
                    Revenue data in one app, engagement in another, supporter demographics somewhere else. You&apos;re tracking everything on spreadsheets.
                  </p>
                </div>
                
                <div className="border-t-2 border-black/10 dark:border-white/10 pt-6 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                      With MeroCircle
                    </div>
                  </div>
                  <p className="text-[16px] text-black/70 dark:text-white/70 leading-relaxed">
                    Unified analytics dashboard. Track revenue, growth, and engagement in one place. Real insights based on your actual supporter behavior, not guesses.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-24 bg-[#fafafa] dark:bg-gray-900">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <Badge className="px-5 py-2 bg-white dark:bg-gray-950 border border-black/20 dark:border-white/20 text-black dark:text-white text-[16px] font-medium rounded-full">
                The Creator Platform That Grows With You
              </Badge>
            </div>
            <h2 className="text-[38px] md:text-[48px] font-bold text-black dark:text-white mb-4 leading-tight tracking-tight">
              Every MeroCircle
              <br />
              Instance Includes
            </h2>
          </div>

          {/* Feature 1 - Right Aligned */}
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-[536px_1fr] gap-8">
              <div className="border-2 border-black/10 dark:border-white/10 rounded-lg p-10 space-y-8">
                <div className="space-y-4">
                  <div className="text-[16px] text-orange-500 font-medium">
                    Production-Grade Creator Tools
                  </div>
                  <h3 className="text-[38px] font-bold text-black dark:text-white leading-tight tracking-tight">
                    Custom Features That Build Themselves
                  </h3>
                </div>
                
                <div className="space-y-4 border-t-2 border-black/5 dark:border-white/5 pt-8">
                  <h4 className="text-[18px] font-semibold text-black dark:text-white">
                    Describe it today, use it tomorrow
                  </h4>
                  <p className="text-[16px] text-black/60 dark:text-white/60 leading-relaxed">
                    Not templates or generic builders. MeroCircle generates actual features from your needs—custom payment flows, unique community features, personalized analytics. Every tool is real functionality, built exactly for your creative business.
                  </p>
                </div>
              </div>

              <div className="border-2 border-black/10 dark:border-white/10 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <div className="aspect-[568/447] flex items-center justify-center p-8">
                  <div className="text-center">
                    <Zap className="w-20 h-20 text-orange-500 mx-auto mb-4" />
                    <p className="text-black/60 dark:text-white/60">Feature Dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 - Left Aligned */}
          <div className="mb-20">
            <div className="grid grid-cols-1 lg:grid-cols-[576px_1fr] gap-8">
              <div className="border-2 border-black/10 dark:border-white/10 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <div className="aspect-[576/453] flex items-center justify-center p-8">
                  <div className="text-center">
                    <Users className="w-20 h-20 text-orange-500 mx-auto mb-4" />
                    <p className="text-black/60 dark:text-white/60">Community Interface</p>
                  </div>
                </div>
              </div>

              <div className="border-2 border-black/10 dark:border-white/10 rounded-lg p-10 space-y-8">
                <div className="space-y-4">
                  <div className="text-[16px] text-orange-500 font-medium">
                    Minimal Work Screens
                  </div>
                  <h3 className="text-[38px] font-bold text-black dark:text-white leading-tight tracking-tight">
                    An Interface Everyone Can Use
                  </h3>
                </div>
                
                <div className="space-y-4 border-t-2 border-black/5 dark:border-white/5 pt-8">
                  <h4 className="text-[18px] font-semibold text-black dark:text-white">
                    Creators typically ramp in about 15 minutes
                  </h4>
                  <p className="text-[16px] text-black/60 dark:text-white/60 leading-relaxed">
                    Because MeroCircle is built for creators&apos; actual needs, each screen shows only what matters. The best interface is almost no interface—create content, engage supporters, track growth. The platform quietly handles everything else.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3 - Right Aligned */}
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-[536px_1fr] gap-8">
              <div className="border-2 border-black/10 dark:border-white/10 rounded-lg p-10 space-y-8">
                <div className="space-y-4">
                  <div className="text-[16px] text-orange-500 font-medium">
                    Deep Creator Intelligence
                  </div>
                  <h3 className="text-[38px] font-bold text-black dark:text-white leading-tight tracking-tight">
                    Your Creative Business&apos;s Brain
                  </h3>
                </div>
                
                <div className="space-y-4 border-t-2 border-black/5 dark:border-white/5 pt-8">
                  <h4 className="text-[18px] font-semibold text-black dark:text-white">
                    Ask anything about your creator business and get researched answers
                  </h4>
                  <p className="text-[16px] text-black/60 dark:text-white/60 leading-relaxed">
                    &quot;Why did engagement drop this week?&quot; triggers analysis across all your data. &quot;What content performs best?&quot; pulls from actual metrics, not guesses. Every insight becomes searchable knowledge.
                  </p>
                </div>
              </div>

              <div className="border-2 border-black/10 dark:border-white/10 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                <div className="aspect-[568/447] flex items-center justify-center p-8">
                  <div className="text-center">
                    <TrendingUp className="w-20 h-20 text-orange-500 mx-auto mb-4" />
                    <p className="text-black/60 dark:text-white/60">Analytics Dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Clean */}
      <section ref={testimonialsRef} className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-[1200px] mx-auto px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp} className="inline-block mb-6">
              <Badge className="px-4 py-2 bg-white dark:bg-gray-950 border-2 border-black dark:border-white text-black dark:text-white text-sm font-medium rounded-full">
                Success Stories
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-[38px] md:text-[48px] font-bold text-black dark:text-white">
              Loved by Nepal&apos;s Top Creators
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index} 
                variants={fadeInUp}
              >
                <Card className="p-8 h-full border-2 border-black/10 dark:border-white/10 bg-white dark:bg-gray-950 hover:border-orange-500 transition-colors">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black font-bold text-sm mr-4">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-black dark:text-white">{testimonial.name}</h4>
                      <p className="text-sm text-black/60 dark:text-white/60">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-orange-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-[14px] text-black/70 dark:text-white/70 leading-relaxed">&quot;{testimonial.content}&quot;</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why MeroCircle Section */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <Badge className="px-4 py-2 bg-white dark:bg-gray-950 border border-black/20 dark:border-white/20 text-black dark:text-white text-[16px] font-medium rounded-full">
                MeroCircle Platform
              </Badge>
            </div>
            <h2 className="text-[38px] md:text-[48px] font-bold text-black dark:text-white mb-6 leading-tight tracking-tight">
              Why MeroCircle Is Safer —
              <br />
              and Beats the Alternatives
            </h2>
            <div className="max-w-4xl mx-auto border-2 border-black/10 dark:border-white/10 rounded-lg p-8">
              <p className="text-[16px] text-black/70 dark:text-white/70 leading-relaxed">
                Traditional platforms ask you to wait months for features. MeroCircle ships working tools fast, then iterates daily based on your feedback. Smaller, iterative bets. Faster feedback. Faster Time to Value. Lower risk.
              </p>
            </div>
          </div>

          {/* Comparison Grid */}
          <div className="border-2 border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 bg-gray-50 dark:bg-gray-900 border-b-2 border-black/10 dark:border-white/10">
              <div className="p-6"></div>
              <div className="p-6 border-l-2 border-black/10 dark:border-white/10">
                <h3 className="text-[20px] font-bold text-black dark:text-white text-center">MeroCircle</h3>
              </div>
              <div className="p-6 border-l-2 border-black/10 dark:border-white/10">
                <h3 className="text-[20px] font-bold text-black dark:text-white text-center">Other Platforms</h3>
              </div>
              <div className="p-6 border-l-2 border-black/10 dark:border-white/10">
                <h3 className="text-[20px] font-bold text-black dark:text-white text-center">DIY Setup</h3>
              </div>
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-4 border-b-2 border-black/10 dark:border-white/10">
              <div className="p-6">
                <p className="text-[16px] font-semibold text-black dark:text-white">Time to first value</p>
              </div>
              <div className="p-6 border-l-2 border-black/10 dark:border-white/10">
                <p className="text-[14px] text-black/70 dark:text-white/70">Day 3: First working setup</p>
              </div>
              <div className="p-6 border-l-2 border-black/10 dark:border-white/10">
                <p className="text-[14px] text-black/70 dark:text-white/70">5–9 months (setup → config → launch)</p>
              </div>
              <div className="p-6 border-l-2 border-black/10 dark:border-white/10">
                <p className="text-[14px] text-black/70 dark:text-white/70">3–6 months</p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-4 border-b-2 border-black/10 dark:border-white/10">
              <div className="p-6">
                <p className="text-[16px] font-semibold text-black dark:text-white">Creator adoption</p>
              </div>
              <div className="p-6 border-l-2 border-black/10 dark:border-white/10">
                <p className="text-[14px] text-black/70 dark:text-white/70">Built with creators, tested daily</p>
              </div>
              <div className="p-6 border-l-2 border-black/10 dark:border-white/10">
                <p className="text-[14px] text-black/70 dark:text-white/70">Assumed; training later</p>
              </div>
              <div className="p-6 border-l-2 border-black/10 dark:border-white/10">
                <p className="text-[14px] text-black/70 dark:text-white/70">Heavy setup effort</p>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-4">
              <div className="p-6">
                <p className="text-[16px] font-semibold text-black dark:text-white">Local payments</p>
              </div>
              <div className="p-6 border-l-2 border-black/10 dark:border-white/10">
                <p className="text-[14px] text-black/70 dark:text-white/70">eSewa & Khalti built-in</p>
              </div>
              <div className="p-6 border-l-2 border-black/10 dark:border-white/10">
                <p className="text-[14px] text-black/70 dark:text-white/70">Not possible</p>
              </div>
              <div className="p-6 border-l-2 border-black/10 dark:border-white/10">
                <p className="text-[14px] text-black/70 dark:text-white/70">Manual integration</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Clean */}
      <section className="py-32 bg-[#fafafa] dark:bg-gray-900">
        <div className="max-w-[1200px] mx-auto px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.h2 variants={fadeInUp} className="text-[48px] md:text-[64px] font-bold text-black dark:text-white leading-tight tracking-tight">
              Ready to run the numbers on your creative career?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[16px] text-black/60 dark:text-white/60">
              Start building clarity now.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="px-8 py-4 bg-black hover:bg-black/90 text-white font-medium text-[17px] rounded-full shadow-2xl"
                >
                  Start Your Creator Journey
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white dark:bg-gray-950 border-t-2 border-black/10 dark:border-white/10">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-12 mb-12">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-[32px] font-bold text-black dark:text-white">MeroCircle</h3>
              </div>
              <p className="text-[16px] text-black/60 dark:text-white/60 mb-4 leading-relaxed max-w-md">
                On Demand Creator Platform,
                <br />
                Delivered Overnight.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-black dark:text-white text-[14px] uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-[14px]">
                <li><Link href="/auth" className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors">About us</Link></li>
                <li><Link href="/dashboard" className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/help" className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-black dark:text-white text-[14px] uppercase tracking-wider">Support</h4>
              <ul className="space-y-3 text-[14px]">
                <li><Link href="/help" className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/terms" className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t-2 border-black/10 dark:border-white/10 pt-8">
            <p className="text-[14px] text-black/50 dark:text-white/50">
              © 2024 MeroCircle. Made with ❤️ for Nepal&apos;s creative community.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
