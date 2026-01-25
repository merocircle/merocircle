"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { cardHover, fadeInUp, countUp } from "@/components/animations/variants";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  prefix?: string;
  suffix?: string;
  variant?: "default" | "gradient" | "outline";
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  prefix = "",
  suffix = "",
  variant = "default",
  iconColor = "text-primary",
  iconBgColor = "bg-primary/10",
  className,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const numericValue = typeof value === "number" ? value : parseFloat(value) || 0;

  // Animate count on mount
  React.useEffect(() => {
    if (typeof value !== "number") return;

    const duration = 1000;
    const steps = 30;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      setDisplayValue(Math.floor(numericValue * easedProgress));

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayValue(numericValue);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [numericValue, value]);

  const formattedValue = typeof value === "number"
    ? displayValue.toLocaleString()
    : value;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card
        className={cn(
          "relative overflow-hidden p-4 transition-all duration-300",
          variant === "gradient" && "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20",
          variant === "outline" && "bg-transparent",
          "hover:shadow-lg hover:border-primary/30",
          className
        )}
      >
        <motion.div
          variants={cardHover}
          className="flex items-start justify-between"
        >
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{label}</p>

            <div className="flex items-baseline gap-1">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={formattedValue}
                  variants={countUp}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="text-2xl font-bold tracking-tight"
                >
                  {prefix}{formattedValue}{suffix}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Trend indicator */}
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}
              >
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>

          {/* Icon */}
          <motion.div
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl",
              iconBgColor
            )}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Icon className={cn("h-6 w-6", iconColor)} />
          </motion.div>
        </motion.div>

        {/* Decorative gradient blur */}
        {variant === "gradient" && (
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
        )}
      </Card>
    </motion.div>
  );
}

// Grid of stat cards
interface StatCardGridProps {
  stats: StatCardProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatCardGrid({ stats, columns = 4, className }: StatCardGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
