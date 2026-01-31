'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface BalloonBurstProps {
  onComplete?: () => void;
}

export function BalloonBurst({ onComplete }: BalloonBurstProps) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current || typeof window === 'undefined') return;
    hasRun.current = true;

    // Create a confetti cannon with more visible effects
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    // Fire initial big burst from center
    confetti({
      particleCount: 300,
      spread: 70,
      origin: { x: 0.5, y: 0.5 },
      colors: colors,
      startVelocity: 45,
      gravity: 0.8,
      ticks: 200,
      zIndex: 9999,
    });

    // Fire from left side
    setTimeout(() => {
      confetti({
        particleCount: 150,
        angle: 60,
        spread: 55,
        origin: { x: 0.1, y: 0.5 },
        colors: colors,
        startVelocity: 45,
        gravity: 0.8,
        ticks: 200,
        zIndex: 9999,
      });
    }, 250);

    // Fire from right side
    setTimeout(() => {
      confetti({
        particleCount: 150,
        angle: 120,
        spread: 55,
        origin: { x: 0.9, y: 0.5 },
        colors: colors,
        startVelocity: 45,
        gravity: 0.8,
        ticks: 200,
        zIndex: 9999,
      });
    }, 400);

    // Continuous bursts
    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        onComplete?.();
        return;
      }

      const particleCount = 30 * (timeLeft / duration);
      
      // Launch confetti from random positions
      confetti({
        particleCount: Math.floor(particleCount),
        origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.3, 0.7) },
        colors: colors,
        startVelocity: 30,
        spread: 60,
        gravity: 0.8,
        ticks: 150,
        zIndex: 9999,
      });
    }, 300);

    // Cleanup and call onComplete after duration
    const timeout = setTimeout(() => {
      clearInterval(interval);
      onComplete?.();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return null;
}
