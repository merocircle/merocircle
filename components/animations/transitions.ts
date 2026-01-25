import { Transition } from "framer-motion";

// ============================================
// SPRING PRESETS
// ============================================

export const springBouncy: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 10,
};

export const springStiff: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const springGentle: Transition = {
  type: "spring",
  stiffness: 150,
  damping: 20,
};

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 25,
};

export const springSmooth: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 25,
};

// ============================================
// DURATION PRESETS
// ============================================

export const durationFast: Transition = {
  duration: 0.15,
  ease: "easeOut",
};

export const durationNormal: Transition = {
  duration: 0.3,
  ease: "easeOut",
};

export const durationSlow: Transition = {
  duration: 0.5,
  ease: "easeOut",
};

export const durationVerySlow: Transition = {
  duration: 0.8,
  ease: "easeOut",
};

// ============================================
// EASE PRESETS
// ============================================

export const easeSmooth: Transition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1],
};

export const easeBounce: Transition = {
  duration: 0.5,
  ease: [0.34, 1.56, 0.64, 1],
};

export const easeSnap: Transition = {
  duration: 0.25,
  ease: [0.4, 0, 0.2, 1],
};

export const easeElegant: Transition = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1],
};

// ============================================
// SPECIAL TRANSITIONS
// ============================================

// For like button heart animation
export const heartTransition: Transition = {
  duration: 0.4,
  ease: "easeInOut",
};

// For message send
export const messageSendTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
};

// For modal/popup
export const modalTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

// For skeleton shimmer
export const shimmerTransition: Transition = {
  duration: 1.5,
  repeat: Infinity,
  ease: "linear",
};

// For hover effects
export const hoverTransition: Transition = {
  duration: 0.2,
  ease: "easeOut",
};

// For stagger children
export const staggerTransition = (staggerAmount: number = 0.08): Transition => ({
  staggerChildren: staggerAmount,
  delayChildren: 0.1,
});

// ============================================
// ANIMATION CONFIG HELPERS
// ============================================

export const createSpring = (
  stiffness: number = 200,
  damping: number = 20,
  mass: number = 1
): Transition => ({
  type: "spring",
  stiffness,
  damping,
  mass,
});

export const createTween = (
  duration: number = 0.3,
  ease: string | number[] = "easeOut",
  delay: number = 0
): Transition => ({
  duration,
  ease,
  delay,
});

// ============================================
// WHILEHOVER / WHILETAP PRESETS
// ============================================

export const tapScale = {
  scale: 0.95,
  transition: durationFast,
};

export const hoverScale = {
  scale: 1.05,
  transition: hoverTransition,
};

export const hoverLift = {
  y: -4,
  transition: hoverTransition,
};

export const hoverGlow = (color: string = "rgba(249, 115, 22, 0.3)") => ({
  boxShadow: `0 0 20px 5px ${color}`,
  transition: hoverTransition,
});

// ============================================
// COMPONENT-SPECIFIC CONFIGS
// ============================================

export const cardAnimationConfig = {
  initial: "rest",
  whileHover: "hover",
  whileTap: "pressed",
  transition: hoverTransition,
};

export const buttonAnimationConfig = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: springSnappy,
};

export const listAnimationConfig = {
  initial: "hidden",
  animate: "visible",
  exit: "exit",
  transition: { staggerChildren: 0.05 },
};

export const iconButtonConfig = {
  whileHover: { scale: 1.1 },
  whileTap: { scale: 0.9 },
  transition: springBouncy,
};
