import { useEffect, useRef, useState } from 'react';

export function StatCounter({ value, suffix = '' }) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let frame;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const start = performance.now();
      const duration = 900;
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(value * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: 0.4 });
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value]);

  return <span ref={ref}>{count}{suffix}</span>;
}
