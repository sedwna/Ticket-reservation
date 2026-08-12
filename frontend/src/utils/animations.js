import { useEffect, useRef, useState } from 'react';

// ── Scroll-triggered reveal hook ──
export function useScrollReveal({ threshold = 0.1, rootMargin = '0px' } = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [ref, isVisible];
}

// ── Staggered children animation ──
export function useStaggered(count, { baseDelay = 60, maxDelay = 600 } = {}) {
  return Array.from({ length: count }, (_, i) => ({
    animationDelay: `${Math.min(i * baseDelay, maxDelay)}ms`,
  }));
}

// ── Parallax scroll effect ──
export function useParallax(speed = 0.3) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrollPos = window.innerHeight - rect.top;
      setOffset(scrollPos * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return [ref, offset];
}

// ── Counter animation (animated number) ──
export function useCountUp(target, { duration = 1500, startOnView = true } = {}) {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useScrollReveal({ threshold: 0.3 });
  const currentCount = useRef(0);
  const numericTarget = Number.isFinite(Number(target)) ? Math.max(0, Math.round(Number(target))) : 0;

  useEffect(() => {
    if (startOnView && !isVisible) return;

    const startValue = currentCount.current;
    const difference = numericTarget - startValue;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (difference === 0) {
      return;
    }

    if (reduceMotion || duration <= 0) {
      const immediateFrame = requestAnimationFrame(() => {
        currentCount.current = numericTarget;
        setCount(numericTarget);
      });
      return () => cancelAnimationFrame(immediateFrame);
    }

    const startTime = performance.now();
    let frameId;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextCount = Math.round(startValue + (difference * eased));

      currentCount.current = nextCount;
      setCount(nextCount);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };
    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [numericTarget, duration, startOnView, isVisible]);

  return [ref, count, isVisible];
}

// ── Stagger item component props ──
export function staggerProps(index, baseDelay = 80) {
  return {
    className: 'animate-fade-in-up',
    style: {
      animationDelay: `${index * baseDelay}ms`,
      animationFillMode: 'both',
    },
  };
}
