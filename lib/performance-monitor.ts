'use client';

/**
 * Performance monitoring utilities
 * Tracks navigation performance and provides metrics
 */

interface NavigationMetric {
  route: string;
  loadTime: number;
  timestamp: number;
  type: 'initial' | 'navigation';
}

class PerformanceMonitor {
  private metrics: NavigationMetric[] = [];
  private readonly MAX_METRICS = 50; // Keep last 50 navigations

  /**
   * Track page load performance
   */
  trackNavigation(route: string, type: 'initial' | 'navigation' = 'navigation') {
    if (typeof window === 'undefined') return;

    try {
      // Use Navigation Timing API
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        
        this.addMetric({
          route,
          loadTime,
          timestamp: Date.now(),
          type
        });
      }
    } catch (error) {
      console.warn('Failed to track navigation:', error);
    }
  }

  /**
   * Measure custom timing
   */
  measureTiming(label: string, startTime: number): number {
    const duration = performance.now() - startTime;
    console.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Get average load time for a route
   */
  getAverageLoadTime(route: string): number {
    const routeMetrics = this.metrics.filter(m => m.route === route);
    if (routeMetrics.length === 0) return 0;

    const total = routeMetrics.reduce((sum, m) => sum + m.loadTime, 0);
    return total / routeMetrics.length;
  }

  /**
   * Get all metrics
   */
  getMetrics(): NavigationMetric[] {
    return [...this.metrics];
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalNavigations: number;
    averageLoadTime: number;
    fastestRoute: string | null;
    slowestRoute: string | null;
  } {
    if (this.metrics.length === 0) {
      return {
        totalNavigations: 0,
        averageLoadTime: 0,
        fastestRoute: null,
        slowestRoute: null
      };
    }

    const total = this.metrics.reduce((sum, m) => sum + m.loadTime, 0);
    const avgLoadTime = total / this.metrics.length;

    // Group by route
    const routeAverages = new Map<string, number>();
    this.metrics.forEach(metric => {
      const current = routeAverages.get(metric.route) || [];
      routeAverages.set(metric.route, [...(Array.isArray(current) ? current : [current]), metric.loadTime] as any);
    });

    let fastest: [string, number] | null = null;
    let slowest: [string, number] | null = null;

    routeAverages.forEach((times: any, route) => {
      const avg = times.reduce((a: number, b: number) => a + b, 0) / times.length;
      if (!fastest || avg < fastest[1]) fastest = [route, avg];
      if (!slowest || avg > slowest[1]) slowest = [route, avg];
    });

    return {
      totalNavigations: this.metrics.length,
      averageLoadTime: avgLoadTime,
      fastestRoute: fastest?.[0] || null,
      slowestRoute: slowest?.[0] || null
    };
  }

  /**
   * Log performance summary to console
   */
  logSummary() {
    const summary = this.getSummary();
    console.group('📊 Performance Summary');
    console.log('Total Navigations:', summary.totalNavigations);
    console.log('Average Load Time:', `${summary.averageLoadTime.toFixed(2)}ms`);
    console.log('Fastest Route:', summary.fastestRoute);
    console.log('Slowest Route:', summary.slowestRoute);
    console.groupEnd();
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
  }

  private addMetric(metric: NavigationMetric) {
    this.metrics.push(metric);
    
    // Keep only last N metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor(route: string) {
  if (typeof window !== 'undefined') {
    // Track on mount
    performanceMonitor.trackNavigation(route);
  }
}

/**
 * Log Core Web Vitals
 */
export function logWebVitals(metric: {
  id: string;
  name: string;
  label: string;
  value: number;
}) {
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${metric.name}:`, metric.value);
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to your analytics service
    // Example: window.gtag?.('event', metric.name, { value: metric.value });
  }
}
