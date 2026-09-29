'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView, useMotionValue } from 'motion/react';

export function NumberTicker({
  value,
  format = (v) => Math.round(v).toLocaleString('en-US'),
  duration = 1.1,
  className,
  delay = 0,
}: {
  value: number;
  format?: (v: number) => string;
  duration?: number;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const prev = useRef(0);

  useEffect(() => {
    if (!inView) return;
    const from = prev.current;
    const controls = animate(mv, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = format(v);
      },
    });
    prev.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView]);

  useEffect(() => {
    if (ref.current && ref.current.textContent === '') ref.current.textContent = format(prev.current);
  });

  return <span ref={ref} className={className} />;
}
