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
import { ColorfulHero } from "@/components/ui/colorful-hero";
import { FloatingElements } from "@/components/ui/floating-elements";
import Image from "next/image";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// Hero stats data
const heroStats = [
  { value: "5K+", label: "Nepal Creators", icon: Users, color: "from-blue-500 to-cyan-500" },
  { value: "₹2M+", label: "Creator Earnings", icon: TrendingUp, color: "from-green-500 to-emerald-500" },
  { value: "50K+", label: "Active Supporters", icon: Heart, color: "from-pink-500 to-rose-500" },
  { value: "99.9%", label: "Uptime", icon: Shield, color: "from-purple-500 to-violet-500" },
];

// Features data with colorful gradients
const features = [
  {
    icon: Heart,
    title: "Local Payment Solutions",
    description: "Seamlessly receive payments through eSewa and Khalti - Nepal's most trusted payment gateways.",
    gradient: "from-red-500 to-pink-500",
    bgGradient: "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20"
  },
  {
    icon: Users,
    title: "Build Your Community",
    description: "Connect with supporters, share exclusive content, and build lasting relationships with your audience.",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
  },
  {
    icon: TrendingUp,
    title: "Analytics & Insights",
    description: "Track your growth with detailed analytics, revenue insights, and audience engagement metrics.",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Your data and transactions are protected with bank-grade security and 99.9% uptime guarantee.",
    gradient: "from-purple-500 to-violet-500",
    bgGradient: "from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20"
  },
  {
    icon: Zap,
    title: "Quick Setup",
    description: "Get started in minutes. Set up your creator profile and start receiving support immediately.",
    gradient: "from-yellow-500 to-orange-500",
    bgGradient: "from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20"
  },
  {
    icon: Globe,
    title: "Made for Nepal",
    description: "Built specifically for Nepali creators with local language support and cultural understanding.",
    gradient: "from-indigo-500 to-blue-500",
    bgGradient: "from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20"
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
    gradient: "from-pink-500 to-rose-500"
  },
  {
    name: "Raj Gurung",
    role: "Content Creator",
    content: "The community features are amazing. I can connect with my audience like never before.",
    avatar: "RG",
    rating: 5,
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    name: "Maya Thapa",
    role: "Writer",
    content: "Finally, a platform that understands Nepali creators. The analytics help me grow better.",
    avatar: "MT",
    rating: 5,
    gradient: "from-purple-500 to-violet-500"
  }
];

// Floating icon component
function FloatingIcon({ icon: Icon, delay, className }: { icon: React.ComponentType<{ className?: string }>; delay: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.4, 0.8, 0.4],
        scale: [1, 1.2, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`absolute ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-700 dark:text-gray-300" />
      </div>
    </motion.div>
  );
}

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

  // Parallax effect for background
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  // Redirect authenticated users immediately - check before rendering landing page
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

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

  // Don't render landing page content if authenticated or still loading
  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
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
      
      {/* Colorful Hero Section */}
      <ColorfulHero />

      {/* Stats Section - Colorful */}
      <section ref={heroRef} className="py-20 bg-gradient-to-b from-white via-blue-50/50 to-purple-50/50 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20 relative overflow-hidden">
        {/* Floating decorative elements */}
        <FloatingIcon icon={Star} delay={0} className="top-10 left-10 hidden md:block" />
        <FloatingIcon icon={Heart} delay={1} className="top-20 right-20 hidden md:block" />
        <FloatingIcon icon={Sparkles} delay={2} className="bottom-20 left-20 hidden md:block" />
        <FloatingIcon icon={Award} delay={1.5} className="bottom-10 right-10 hidden md:block" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-12"
          >
            {/* Hero Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {heroStats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  className="text-center group cursor-pointer"
                >
                  <motion.div 
                    className={`mb-4 mx-auto w-20 h-20 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <stat.icon className="w-10 h-10 text-white" />
                  </motion.div>
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth">
                <Button size="lg" className="group px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105">
                  Start Creating Today
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-900 dark:text-gray-100 font-semibold rounded-full transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800 backdrop-blur-sm">
                  <Coffee className="mr-2 w-5 h-5" />
                  Explore Creators
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section - Colorful */}
      <section ref={featuresRef} className="py-24 bg-white dark:bg-gray-900 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            style={{ 
              y: backgroundY,
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(99, 102, 241, 0.1) 1px, transparent 0)`,
              backgroundSize: '50px 50px'
            }}
            className="absolute inset-0"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 text-green-800 dark:text-green-200 text-sm font-medium rounded-full mb-4 border border-green-200 dark:border-green-800">
                Why Choose MeroCircle?
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Built for Nepal&apos;s
              <span className="block bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent"> Creative Future</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Every feature is designed with Nepali creators in mind, from local payment integration to community building tools.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                variants={scaleIn}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`p-8 h-full hover:shadow-2xl transition-all duration-300 group cursor-pointer border-2 bg-gradient-to-br ${feature.bgGradient} border-transparent hover:border-opacity-50`}>
                  <motion.div 
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section - Colorful */}
      <section ref={testimonialsRef} className="py-24 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-blue-950/20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-200 text-sm font-medium rounded-full mb-4 border border-yellow-200 dark:border-yellow-800">
                Success Stories
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Loved by Nepal&apos;s
              <span className="block bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent"> Top Creators</span>
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
                variants={scaleIn}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-8 h-full hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center mb-6">
                    <motion.div 
                      className={`w-14 h-14 bg-gradient-to-br ${testimonial.gradient} rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg`}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      {testimonial.avatar}
                    </motion.div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-gray-100">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">&quot;{testimonial.content}&quot;</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Colorful Gradient */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated gradient overlay */}
        <motion.div
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-90"
          style={{
            backgroundSize: "200% 200%",
          }}
        />
        
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Start Your
              <br />
              Creative Journey?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
              Join thousands of Nepali creators who are already building sustainable income streams and thriving communities.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth">
                <Button size="lg" className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 font-semibold rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg" className="px-8 py-4 border-2 border-white text-white hover:bg-white/10 font-semibold rounded-full transition-all duration-300 backdrop-blur-sm">
                  <Play className="mr-2 w-5 h-5" />
                  Explore Creators
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Heart className="w-8 h-8 text-red-500 mr-3" />
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MeroCircle</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Empowering Nepal&apos;s creative economy with local payment solutions, community building tools, and creator-focused features.
              </p>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Trusted by 5,000+ creators</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-gray-900 dark:text-gray-100">Platform</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><Link href="/auth" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Get Started</Link></li>
                <li><Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Explore Creators</Link></li>
                <li><Link href="/discover" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Discover</Link></li>
                <li><Link href="/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-gray-900 dark:text-gray-100">Support</h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li><Link href="/help" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2024 MeroCircle. Made with ❤️ for Nepal&apos;s creative community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
