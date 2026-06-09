import React, { forwardRef } from 'react';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';

export const CanvasPreview = forwardRef<HTMLCanvasElement>((_, ref) => {
  const internalRef = React.useRef<HTMLCanvasElement | null>(null);

  const setRef = React.useCallback((el: HTMLCanvasElement | null) => {
    internalRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
  }, [ref]);

  useCanvasRenderer(internalRef);

  return (
    <canvas
      ref={setRef}
      width={1080}
      height={1920}
      style={{
        display: 'block',
        height: '100%',
        width: 'auto',
        maxWidth: '100%',
        aspectRatio: '9 / 16',
        borderRadius: '12px',
        boxShadow: '0 8px 60px rgba(0,0,0,0.8), 0 0 40px rgba(168,85,247,0.15)',
        objectFit: 'contain',
      }}
    />
  );
});

CanvasPreview.displayName = 'CanvasPreview';
