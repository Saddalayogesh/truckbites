import { useEffect, useRef, useState } from 'react';

/**
 * Premium scroll-reveal wrapper — fades + slides content up as it enters
 * the viewport (Framer-Motion style, dependency-free).
 *
 * Props:
 *  - delay:   stagger delay in ms (default 0)
 *  - as:      element tag to render (default 'div')
 *  - once:    reveal only the first time (default true)
 */
export default function Reveal({ children, delay = 0, className = '', as: Tag = 'div', once = true }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={`${visible ? 'reveal-visible' : 'reveal'} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
