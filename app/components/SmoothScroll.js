'use client';

import { ReactLenis } from 'lenis/react';

export default function SmoothScroll({ children }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true, wheelMultiplier: 1.05, touchMultiplier: 1.5 }}>
      {children}
    </ReactLenis>
  );
}
