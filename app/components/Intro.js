'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

/* ─── Minimal Status Subtitles ───────────────────────────────── */
const STATUS_STEPS = [
  { pct: 0,   text: 'INITIALIZING AI ROUTE ENGINE' },
  { pct: 30,  text: 'CURATING WORLD EXPEDITIONS' },
  { pct: 65,  text: 'OPTIMIZING FLIGHTS & STAYS' },
  { pct: 90,  text: 'FINALIZING YOUR ITINERARY' },
  { pct: 100, text: 'WELCOME TO TRIPWISE' },
];

export default function MinimalLoader() {
  const [mounted, setMounted] = useState(true);

  /* DOM Refs */
  const overlayRef     = useRef(null);
  const counterRef     = useRef(null);
  const percentRef     = useRef(null);
  const statusRef      = useRef(null);
  const progressBarRef = useRef(null);
  const brandRef       = useRef(null);
  const footerRef      = useRef(null);
  const curtainRef     = useRef(null);
  const tlRef          = useRef(null);

  /* ── Teardown & Skip ────────────────────────────────────────── */
  const cleanAndExit = useCallback(() => {
    sessionStorage.setItem('tw_intro_seen', '1');
    tlRef.current?.kill();
    document.body.style.overflow = '';

    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => setMounted(false),
      });
    } else {
      setMounted(false);
    }
  }, []);

  useEffect(() => {
    /* First-visit check with ?intro=true override */
    const params = new URLSearchParams(window.location.search);
    const force  = params.get('intro') === 'true';
    if (sessionStorage.getItem('tw_intro_seen') && !force) {
      setMounted(false);
      return;
    }

    document.body.style.overflow = 'hidden';

    const countObj = { val: 0 };
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tlRef.current = tl;

    // Initial states
    gsap.set(overlayRef.current, { opacity: 0 });
    gsap.set([brandRef.current, footerRef.current], { opacity: 0, y: (i) => (i === 0 ? -10 : 10) });
    gsap.set([counterRef.current, percentRef.current, statusRef.current], { opacity: 0, y: 15 });
    gsap.set(progressBarRef.current, { width: '0%' });

    /* ── 1. Soft Entrance ─────────────────────────────────────── */
    tl.to(overlayRef.current, { opacity: 1, duration: 0.4 })
      .to([brandRef.current, footerRef.current], { opacity: 1, y: 0, duration: 0.6 }, '<+0.1')
      .to([counterRef.current, percentRef.current, statusRef.current], { opacity: 1, y: 0, duration: 0.6 }, '<+0.15');

    /* ── 2. Clean 000 -> 100 Countup (2.4s duration) ──────────── */
    tl.to(
      countObj,
      {
        val: 100,
        duration: 2.4,
        ease: 'power1.inOut',
        onUpdate: () => {
          const current = Math.round(countObj.val);
          const str = current.toString().padStart(3, '0');
          if (counterRef.current) counterRef.current.textContent = str;
          if (progressBarRef.current) progressBarRef.current.style.width = `${current}%`;

          // Match status text
          const currentStep = [...STATUS_STEPS].reverse().find((s) => current >= s.pct);
          if (currentStep && statusRef.current) {
            statusRef.current.textContent = currentStep.text;
          }
        },
      },
      '0.5'
    );

    /* ── 3. Subtle Hold on 100% ───────────────────────────────── */
    tl.addLabel('complete', '+=0.2');

    /* ── 4. Elegant Smooth Dissolve & Flight Transition ───────── */
    tl.to(
      [counterRef.current, percentRef.current, statusRef.current, footerRef.current, '.ml-tagline', '.ml-brand-name', '#intro-path', '#intro-circle'],
      {
        opacity: 0,
        y: -15,
        duration: 0.45,
        ease: 'power2.in',
      },
      'complete'
    )
    .to(
      overlayRef.current,
      {
        backgroundColor: 'rgba(255, 248, 245, 0)',
        duration: 0.5,
      },
      'complete'
    )
    .add(() => {
        const sourceSvg = document.getElementById('intro-logo-svg');
        const targetSvg = document.getElementById('navbar-logo-svg');
        const targetPlane = document.getElementById('navbar-plane');

        if (!sourceSvg || !targetSvg || !targetPlane) {
            cleanAndExit();
            return;
        }

        // Hide target plane temporarily
        targetPlane.style.opacity = '0';

        // Get absolute coordinates
        const sourceRect = sourceSvg.getBoundingClientRect();
        const targetRect = targetSvg.getBoundingClientRect();

        // Create a fixed clone
        const clone = sourceSvg.cloneNode(true);
        clone.id = 'flying-plane-clone';
        
        // Hide non-plane elements in the clone
        const clonePath = clone.querySelector('#intro-path');
        const cloneCircle = clone.querySelector('#intro-circle');
        if (clonePath) clonePath.style.opacity = '0';
        if (cloneCircle) cloneCircle.style.opacity = '0';
        
        document.body.appendChild(clone);

        // Position clone exactly over the source
        gsap.set(clone, {
            position: 'fixed',
            top: 0,
            left: 0,
            x: sourceRect.left,
            y: sourceRect.top,
            width: sourceRect.width,
            height: sourceRect.height,
            zIndex: 999999,
            margin: 0,
            transformOrigin: "center center"
        });

        // Hide original source SVG
        sourceSvg.style.opacity = '0';

        // Smooth, Fluid Flight Animation
        const flightDuration = 1.2;

        gsap.to(clone, {
            x: targetRect.left,
            width: targetRect.width,
            duration: flightDuration,
            ease: "power2.inOut"
        });

        gsap.to(clone, {
            y: targetRect.top,
            height: targetRect.height,
            duration: flightDuration,
            ease: "power3.inOut", // Smooth curve, no overshoot
            onComplete: () => {
                if (targetPlane) targetPlane.style.opacity = '1';
                if (clone) clone.remove();
                
                // Finally fade out the transparent overlay to unmount
                if (overlayRef.current) {
                    gsap.to(overlayRef.current, {
                        opacity: 0,
                        duration: 0.3,
                        onComplete: () => {
                            sessionStorage.setItem('tw_intro_seen', '1');
                            cleanAndExit();
                        }
                    });
                } else {
                    sessionStorage.setItem('tw_intro_seen', '1');
                    cleanAndExit();
                }
            }
        });
    }, 'complete+=0.1');

    /* ── Skip Listener ────────────────────────────────────────── */
    const onKey = (e) => {
      if (e.key === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        cleanAndExit();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      tl.kill();
      document.body.style.overflow = '';
    };
  }, [cleanAndExit]);

  if (!mounted) return null;

  return (
    <>
      <style>{CSS}</style>

      <div
        ref={overlayRef}
        className="ml-overlay"
        role="dialog"
        aria-label="TripWise Loading"
        aria-modal="true"
      >
        {/* Skip button */}
        <button className="ml-skip" onClick={cleanAndExit} aria-label="Skip loader">
          ESC TO SKIP
        </button>

        {/* ── Top Header Brandmark ─────────────────────────────── */}
        <div ref={brandRef} className="ml-header">
          <div className="ml-brand">
            <svg id="intro-logo-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="ml-brand-svg">
              <path
                id="intro-path"
                d="M24 170 C 70 135, 105 105, 168 42"
                fill="none"
                stroke="#8C827A"
                strokeWidth="4"
                strokeDasharray="3 12"
                strokeLinecap="round"
              />
              <circle id="intro-circle" cx="24" cy="170" r="9" fill="#1C1B1B" />
              <g id="intro-plane" transform="translate(136,28) rotate(45)">
                <path
                  d="M0 34 L8 0 L16 34 L34 44 L34 52 L16 46 L13 64 L21 70 L21 76 L8 70 L-5 76 L-5 70 L3 64 L0 46 L-18 52 L-18 44 Z"
                  fill="#EC6735"
                />
              </g>
            </svg>
            <span className="ml-brand-name">TRIPWISE</span>
          </div>
          <span className="ml-tagline">GLOBAL EXPEDITIONS</span>
        </div>

        {/* ── Center Stage: Minimal 000 -> 100% Count ─────────── */}
        <div className="ml-center">
          <div className="ml-counter-row">
            <span ref={counterRef} className="ml-counter-num">
              000
            </span>
            <span ref={percentRef} className="ml-counter-pct">
              %
            </span>
          </div>

          {/* Minimalist Progress Line */}
          <div className="ml-progress-track">
            <div ref={progressBarRef} className="ml-progress-fill" />
          </div>

          {/* Clean Subtitle */}
          <p ref={statusRef} className="ml-status">
            INITIALIZING AI ROUTE ENGINE
          </p>
        </div>

        {/* ── Minimal Footer ───────────────────────────────────── */}
        <div ref={footerRef} className="ml-footer">
          <span>CURATING BESPOKE ITINERARIES</span>
          <span>© {new Date().getFullYear()} TRIPWISE INC.</span>
        </div>
      </div>
    </>
  );
}

/* ─── Light-Theme Minimal CSS (Exact Match to #FFF8F5) ────────── */
const CSS = `
/* ============================================================
   MINIMAL LUXURY LIGHT PRELOADER — MATCHES TRIPWISE THEME
   ============================================================ */

.ml-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  background-color: #FFF8F5; /* Matches exact --background token */
  color: #1C1B1B;
  padding: 36px 40px;
  user-select: none;
  font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  overflow: hidden;
}

/* ── Skip Button ──────────────────────────────────────────────── */
.ml-skip {
  position: absolute;
  top: 36px;
  right: 40px;
  background: none;
  border: 1px solid rgba(28, 27, 27, 0.12);
  border-radius: 999px;
  font: 600 10px/1 'Courier New', monospace;
  letter-spacing: 0.14em;
  color: #8C827A;
  padding: 8px 14px;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.2s ease;
}
.ml-skip:hover {
  color: #1C1B1B;
  border-color: rgba(28, 27, 27, 0.4);
  background: rgba(236, 103, 53, 0.05);
}

/* ── Header Brand ─────────────────────────────────────────────── */
.ml-header {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.ml-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ml-brand-svg {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.ml-brand-name {
  font-family: var(--font-serif, "Playfair Display", Georgia, serif);
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: #1C1B1B;
}

.ml-tagline {
  font: 600 11px/1 'Courier New', monospace;
  letter-spacing: 0.2em;
  color: #8C827A;
  text-transform: uppercase;
}

/* ── Center Stage ────────────────────────────────────────────── */
.ml-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  max-width: 480px;
  width: 100%;
}

.ml-counter-row {
  display: flex;
  align-items: baseline;
  line-height: 0.9;
}

.ml-counter-num {
  font-family: var(--font-serif, "Playfair Display", Georgia, serif);
  font-size: clamp(84px, 16vw, 160px);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #1C1B1B;
  font-variant-numeric: tabular-nums;
}

.ml-counter-pct {
  font-family: 'Courier New', monospace;
  font-size: clamp(24px, 4vw, 40px);
  font-weight: 600;
  color: #EC6735;
  margin-left: 8px;
}

/* ── Minimalist Progress Line ─────────────────────────────────── */
.ml-progress-track {
  width: 100%;
  max-width: 320px;
  height: 2px;
  background-color: rgba(28, 27, 27, 0.08);
  border-radius: 999px;
  overflow: hidden;
}

.ml-progress-fill {
  height: 100%;
  width: 0%;
  background-color: #EC6735;
  border-radius: 999px;
  transition: width 0.05s linear;
}

/* ── Status Text ──────────────────────────────────────────────── */
.ml-status {
  font: 600 11px/1 'Courier New', monospace;
  letter-spacing: 0.18em;
  color: #8C827A;
  text-transform: uppercase;
  margin: 0;
}

/* ── Footer ───────────────────────────────────────────────────── */
.ml-footer {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font: 600 10px/1 'Courier New', monospace;
  letter-spacing: 0.14em;
  color: #A39B94;
  text-transform: uppercase;
}

/* ── Mobile Adjustments ───────────────────────────────────────── */
@media (max-width: 640px) {
  .ml-overlay {
    padding: 24px 20px;
  }
  .ml-skip {
    top: 24px;
    right: 20px;
  }
  .ml-tagline {
    display: none;
  }
  .ml-footer {
    flex-direction: column;
    gap: 8px;
    align-items: center;
    text-align: center;
  }
}
`;
