"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";

interface RoundedSectionProps {
  children: ReactNode;
  className?: string;
  theme?: "black" | "grey" | "white";
  animateIn?: boolean;
  id?: string;
}

export function RoundedSection({
  children,
  className,
  theme = "black",
  animateIn = true,
  id,
}: RoundedSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "start center"] as any,
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.8, 1]);

  const themeClasses = {
    black: "bg-gray-950 text-white dark:bg-gray-950 dark:text-white",
    grey: "bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100",
    white: "bg-white text-gray-900 dark:bg-white dark:text-gray-900",
  };

  return (
    <section 
      ref={containerRef}
      id={id}
      className={cn(
        "rounded-section",
        "relative w-full overflow-x-hidden first:mt-0",
        "py-20 sm:py-24 md:py-28 lg:py-36",
        "rounded-t-[2.5rem] sm:rounded-t-[3.5rem] md:rounded-t-[5.5rem] lg:rounded-t-[8.5rem]",
        themeClasses[theme],
        className
      )}
    >
      <motion.div
        style={animateIn ? { scale, y, opacity } : {}}
        className="container mx-auto px-4 sm:px-5 md:px-6 relative z-10 max-w-7xl"
      >
        {children}
      </motion.div>
    </section>
  );
}
