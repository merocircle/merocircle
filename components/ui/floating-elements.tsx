"use client";

import { motion } from "framer-motion";
import { 
  Heart, 
  Star, 
  Zap, 
  Sparkles, 
  MessageCircle, 
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  Calendar,
  Bookmark,
  Lightbulb
} from "lucide-react";

interface FloatingElementProps {
  icon: React.ComponentType<{ className?: string }>;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  className?: string;
}

function FloatingElement({ 
  icon: Icon, 
  delay = 0, 
  duration = 6,
  x = 0,
  y = 0,
  size = 60,
  color = "blue",
  className = ""
}: FloatingElementProps) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
    pink: "bg-pink-500/20 text-pink-600 dark:text-pink-400",
    orange: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
    green: "bg-green-500/20 text-green-600 dark:text-green-400",
    yellow: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.3, 0.7, 0.3],
        scale: [1, 1.1, 1],
        x: [x, x + 20, x],
        y: [y, y - 30, y],
        rotate: [0, 10, -10, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={`absolute rounded-2xl p-3 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 shadow-lg ${colorClasses[color]} ${className}`}
      style={{ width: size, height: size }}
    >
      <Icon className="w-8 h-8" />
    </motion.div>
  );
}

export function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top Left */}
      <FloatingElement 
        icon={Heart} 
        delay={0} 
        duration={8}
        x={-20}
        y={100}
        size={70}
        color="pink"
        className="top-[10%] left-[5%]"
      />
      <FloatingElement 
        icon={Star} 
        delay={1} 
        duration={7}
        x={50}
        y={150}
        size={50}
        color="yellow"
        className="top-[15%] left-[8%]"
      />

      {/* Top Right */}
      <FloatingElement 
        icon={Zap} 
        delay={0.5} 
        duration={9}
        x={-30}
        y={80}
        size={65}
        color="orange"
        className="top-[12%] right-[5%]"
      />
      <FloatingElement 
        icon={Sparkles} 
        delay={1.5} 
        duration={6}
        x={40}
        y={120}
        size={55}
        color="purple"
        className="top-[18%] right-[10%]"
      />

      {/* Middle Left */}
      <FloatingElement 
        icon={MessageCircle} 
        delay={2} 
        duration={8}
        x={-25}
        y={100}
        size={60}
        color="blue"
        className="top-[40%] left-[3%]"
      />
      <FloatingElement 
        icon={TrendingUp} 
        delay={2.5} 
        duration={7}
        x={35}
        y={140}
        size={50}
        color="green"
        className="top-[45%] left-[7%]"
      />

      {/* Middle Right */}
      <FloatingElement 
        icon={Users} 
        delay={1} 
        duration={9}
        x={-40}
        y={90}
        size={70}
        color="purple"
        className="top-[35%] right-[4%]"
      />
      <FloatingElement 
        icon={CheckCircle} 
        delay={3} 
        duration={6}
        x={30}
        y={110}
        size={45}
        color="green"
        className="top-[50%] right-[12%]"
      />

      {/* Bottom Left */}
      <FloatingElement 
        icon={Clock} 
        delay={2.2} 
        duration={8}
        x={-20}
        y={130}
        size={55}
        color="blue"
        className="top-[70%] left-[6%]"
      />
      <FloatingElement 
        icon={Calendar} 
        delay={3.5} 
        duration={7}
        x={45}
        y={100}
        size={50}
        color="orange"
        className="top-[75%] left-[10%]"
      />

      {/* Bottom Right */}
      <FloatingElement 
        icon={Bookmark} 
        delay={1.8} 
        duration={9}
        x={-35}
        y={115}
        size={60}
        color="pink"
        className="top-[65%] right-[8%]"
      />
      <FloatingElement 
        icon={Lightbulb} 
        delay={4} 
        duration={6}
        x={25}
        y={125}
        size={50}
        color="yellow"
        className="top-[80%] right-[5%]"
      />
    </div>
  );
}
