import { Variants, Transition } from "framer-motion";

// ============================================
// ENTRANCE ANIMATIONS
// ============================================

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
};

export const scaleInBounce: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 15 },
  },
};

// ============================================
// CONTAINER/STAGGER ANIMATIONS
// ============================================

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

// ============================================
// INTERACTIVE ANIMATIONS
// ============================================

// Instagram-style heart burst animation
export const heartBurst: Variants = {
  initial: { scale: 1 },
  liked: {
    scale: [1, 1.3, 0.9, 1.1, 1],
    transition: { duration: 0.4, ease: "easeInOut" },
  },
  unliked: {
    scale: [1, 0.8, 1],
    transition: { duration: 0.2 },
  },
};

// Heart particle animation for burst effect
export const heartParticle: Variants = {
  initial: { opacity: 0, scale: 0, y: 0 },
  animate: (i: number) => ({
    opacity: [0, 1, 0],
    scale: [0, 1, 0.5],
    y: -40,
    x: Math.sin(i * 0.8) * 30,
    transition: {
      duration: 0.6,
      delay: i * 0.05,
      ease: "easeOut",
    },
  }),
};

// Bookmark animation
export const bookmarkPop: Variants = {
  initial: { scale: 1 },
  saved: {
    scale: [1, 1.2, 1],
    transition: { duration: 0.3, ease: "easeOut" },
  },
  unsaved: {
    scale: [1, 0.9, 1],
    transition: { duration: 0.2 },
  },
};

// Button tap animation
export const buttonTap: Variants = {
  rest: { scale: 1 },
  pressed: { scale: 0.95 },
  hover: { scale: 1.02 },
};

// ============================================
// CARD ANIMATIONS
// ============================================

export const cardHover: Variants = {
  rest: {
    y: 0,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },
  hover: {
    y: -4,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

export const cardTap: Variants = {
  rest: { scale: 1 },
  pressed: { scale: 0.98 },
};

// ============================================
// MESSAGE ANIMATIONS
// ============================================

// iMessage-style message send animation
export const messageSendRight: Variants = {
  initial: { opacity: 0, x: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
};

export const messageSendLeft: Variants = {
  initial: { opacity: 0, x: -20, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 },
  },
};

// Typing indicator dots
export const typingDot: Variants = {
  initial: { y: 0 },
  animate: (i: number) => ({
    y: [-2, 2, -2],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      delay: i * 0.15,
      ease: "easeInOut",
    },
  }),
};

// ============================================
// NOTIFICATION ANIMATIONS
// ============================================

export const notificationSlide: Variants = {
  hidden: { opacity: 0, x: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 },
  },
  exit: {
    opacity: 0,
    x: 50,
    transition: { duration: 0.2 },
  },
};

export const badgePulse: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.2, 1],
    transition: { duration: 0.3, repeat: 2 },
  },
};

export const badgePop: Variants = {
  initial: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 500, damping: 20 },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// ============================================
// POPUP/MODAL ANIMATIONS
// ============================================

export const reactionPicker: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 10,
    transition: { duration: 0.15 },
  },
};

export const emojiPop: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: i * 0.03,
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  }),
  hover: { scale: 1.3, transition: { duration: 0.15 } },
  tap: { scale: 0.9 },
};

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.15 },
  },
};

// ============================================
// LOADING ANIMATIONS
// ============================================

export const shimmer: Variants = {
  initial: { backgroundPosition: "-200% 0" },
  animate: {
    backgroundPosition: "200% 0",
    transition: { duration: 1.5, repeat: Infinity, ease: "linear" },
  },
};

export const skeletonPulse: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
};

export const spinnerRotate: Variants = {
  animate: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: "linear" },
  },
};

// ============================================
// LIST ITEM ANIMATIONS
// ============================================

export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

export const swipeToDelete: Variants = {
  initial: { x: 0, opacity: 1 },
  swiping: { x: -100 },
  deleted: {
    x: "-100%",
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: { duration: 0.3 },
  },
};

// ============================================
// TAB/NAVIGATION ANIMATIONS
// ============================================

export const tabContent: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

export const tabIndicator: Variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
  }),
  animate: {
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
};

// ============================================
// COUNTER ANIMATIONS
// ============================================

export const countUp: Variants = {
  initial: { y: 10, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.2 } },
  exit: { y: -10, opacity: 0, transition: { duration: 0.2 } },
};

export const countDown: Variants = {
  initial: { y: -10, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.2 } },
  exit: { y: 10, opacity: 0, transition: { duration: 0.2 } },
};

// ============================================
// HOVER EFFECTS
// ============================================

export const hoverGlow: Variants = {
  rest: {
    boxShadow: "0 0 0 0 rgba(249, 115, 22, 0)",
  },
  hover: {
    boxShadow: "0 0 20px 5px rgba(249, 115, 22, 0.3)",
    transition: { duration: 0.3 },
  },
};

export const hoverScale: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95 },
};
