import React, { useEffect, useRef, useState } from 'react';

interface ScaledBlockProps {
  scale: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Scales content using CSS transform: scale() and adjusts outer container height
 * via ResizeObserver. Unlike font-size or CSS zoom, transform: scale() cannot be
 * clamped upward by Android TV / Android WebView minimumFontSize restrictions.
 */
export const ScaledBlock: React.FC<ScaledBlockProps> = ({
  scale,
  children,
  className = '',
}) => {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [innerHeight, setInnerHeight] = useState<number | null>(null);

  useEffect(() => {
    if (scale === 1) {
      setInnerHeight(null);
      return;
    }

    const el = innerRef.current;
    if (!el) return;

    const measure = () => {
      const h = el.offsetHeight;
      if (h > 0) {
        setInnerHeight(h);
      }
    };

    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [scale, children]);

  if (scale === 1) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`relative w-full overflow-x-hidden ${className}`}
      style={{
        height: innerHeight !== null ? `${Math.ceil(innerHeight * scale) + 2}px` : 'auto',
      }}
    >
      <div
        ref={innerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${100 / scale}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
