"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useInView, useAnimation } from "framer-motion";
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
  Palette,
  Play,
  CheckCircle,
  ArrowDown,
} from "lucide-react";
import { Header } from "@/components/header";
import { useAuth } from "@/contexts/supabase-auth-context";
import { logger } from "@/lib/logger";

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
      staggerChildren: 0.2,
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
    gradient: "from-red-500 to-pink-500"
  },
  {
    icon: Users,
    title: "Build Your Community",
    description: "Connect with supporters, share exclusive content, and build lasting relationships with your audience.",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: TrendingUp,
    title: "Analytics & Insights",
    description: "Track your growth with detailed analytics, revenue insights, and audience engagement metrics.",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Your data and transactions are protected with bank-grade security and 99.9% uptime guarantee.",
    gradient: "from-purple-500 to-violet-500"
  },
  {
    icon: Zap,
    title: "Quick Setup",
    description: "Get started in minutes. Set up your creator profile and start receiving support immediately.",
    gradient: "from-yellow-500 to-orange-500"
  },
  {
    icon: Globe,
    title: "Made for Nepal",
    description: "Built specifically for Nepali creators with local language support and cultural understanding.",
    gradient: "from-indigo-500 to-blue-500"
  }
];

// Testimonials data
const testimonials = [
  {
    name: "Priya Sharma",
    role: "Digital Artist",
    content: "CreatorsNepal transformed my art journey. Local payments made it so easy for my supporters!",
    avatar: "PS",
    rating: 5
  },
  {
    name: "Raj Gurung",
    role: "Content Creator",
    content: "The community features are amazing. I can connect with my audience like never before.",
    avatar: "RG",
    rating: 5
  },
  {
    name: "Maya Thapa",
    role: "Writer",
    content: "Finally, a platform that understands Nepali creators. The analytics help me grow better.",
    avatar: "MT",
    rating: 5
  }
];

export default function LandingPage() {
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const controls = useAnimation();
  const [urlMessage, setUrlMessage] = useState<string | null>(null);
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHeroInView) {
      controls.start("visible");
    }
    
    // Check for URL messages
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');
    if (message) {
      setUrlMessage(message);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isHeroInView, controls]);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isAuthenticated) {
        logger.debug('Redirecting to dashboard after timeout', 'LANDING_PAGE');
        router.push('/dashboard');
      }
    }, 3000); // 3 second timeout

    if (!loading && isAuthenticated) {
      clearTimeout(timeoutId);
      router.push('/dashboard');
    }

    return () => clearTimeout(timeoutId);
  }, [loading, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
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
      
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 opacity-50 dark:opacity-30" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 dark:bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            animate={controls}
            variants={staggerContainer}
            className="space-y-8"
          >
            {/* Hero Badge */}
            <motion.div variants={fadeInUp}>
              <Badge className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-full">
                <Star className="w-4 h-4 mr-2" />
                Nepal's #1 Creator Economy Platform
              </Badge>
            </motion.div>

            {/* Hero Heading */}
            <motion.div variants={fadeInUp} className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold">
                <span className="text-gray-900 dark:text-gray-100">Empower Nepal's</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Creative Economy
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                The only platform designed specifically for Nepali creators. Accept payments through eSewa & Khalti, 
                build communities, and turn your passion into sustainable income.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button size="lg" className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl">
                  Start Creating Today
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="lg" className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 font-semibold rounded-full transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Coffee className="mr-2 w-5 h-5" />
                  Explore Creators
                </Button>
              </Link>
            </motion.div>

            {/* Hero Stats */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {heroStats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  className="text-center group cursor-pointer"
                >
                  <div className="mb-2 mx-auto w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400 dark:text-gray-500 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <ArrowDown className="w-6 h-6 animate-bounce" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 text-green-800 dark:text-green-200 text-sm font-medium rounded-full mb-4">
                Why Choose CreatorsNepal?
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Built for Nepal's
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> Creative Future</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Every feature is designed with Nepali creators in mind, from local payment integration to community building tools.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={scaleIn}>
                <Card className="p-8 h-full hover:shadow-xl transition-all duration-300 group cursor-pointer border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
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

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 text-yellow-800 dark:text-yellow-200 text-sm font-medium rounded-full mb-4">
                Success Stories
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Loved by Nepal's
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent"> Top Creators</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={scaleIn}>
                <Card className="p-8 h-full hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-0">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      {testimonial.avatar}
                    </div>
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
                  <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">"{testimonial.content}"</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Your
              <br />
              Creative Journey?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
              Join thousands of Nepali creators who are already building sustainable income streams and thriving communities.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button size="lg" className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl">
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="px-8 py-4 border-2 border-white text-white hover:bg-white/10 font-semibold rounded-full transition-all duration-300">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-gray-900 dark:bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <Heart className="w-8 h-8 text-red-500 mr-3" />
                <h3 className="text-2xl font-bold">CreatorsNepal</h3>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering Nepal's creative economy with local payment solutions, community building tools, and creator-focused features.
              </p>
              <div className="flex space-x-4">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">Trusted by 5,000+ creators</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/signup/creator" className="hover:text-white transition-colors">For Creators</Link></li>
                <li><Link href="/explore" className="hover:text-white transition-colors">Explore Creators</Link></li>
                <li><Link href="/discover" className="hover:text-white transition-colors">Discover</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CreatorsNepal. Made with ❤️ for Nepal's creative community.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
