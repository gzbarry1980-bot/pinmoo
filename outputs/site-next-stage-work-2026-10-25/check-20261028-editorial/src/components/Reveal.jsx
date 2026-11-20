import { useEffect, useRef, useState } from 'react';

export function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.unobserve(node);
      }
    }, { threshold: 0.14 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const classes = 'reveal ' + (visible ? 'is-visible ' : '') + className;
  return (
    <Tag ref={ref} className={classes} style={{ transitionDelay: delay + 'ms' }}>
      {children}
    </Tag>
  );
}
