'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * FigmaPinnedSlide
 * 
 * Luxury Figma / Keynote style pinned horizontal slide-over transition:
 * 1. As soon as the Live Demo section hits the top of the viewport, the screen LOCKS (pins).
 * 2. While the screen is locked, scrolling drives the Difference Slider section to slide
 *    horizontally from the right (x: 100% -> 0%) directly ON TOP of the Live Demo section.
 * 3. Once the Difference Slider fully covers the screen, the pin unlocks and normal vertical
 *    scroll resumes to subsequent sections.
 */
export default function FigmaPinnedSlide({ baseSection, slideSection }) {
  const pinWrapperRef = useRef(null);
  const baseContainerRef = useRef(null);
  const slideSheetRef = useRef(null);
  const leftBeamRef = useRef(null);
  const topBeamRef = useRef(null);
  const mobileTopBeamRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const pinWrapper = pinWrapperRef.current;
    const baseContainer = baseContainerRef.current;
    const slideSheet = slideSheetRef.current;
    if (!pinWrapper || !baseContainer || !slideSheet) return;

    // Initial off-screen state for sliding layer (100% to the right)
    gsap.set(slideSheet, {
      xPercent: 100,
      scale: 0.96,
      rotateY: -5,
      transformPerspective: 2400,
      transformOrigin: 'left center',
      boxShadow: '-35px 0 85px -15px rgba(0,0,0,0.22), -12px 0 32px -5px rgba(0,0,0,0.14), -3px 0 18px rgba(255,91,29,0.55), inset 1px 0 0 rgba(255,255,255,0.98)'
    });

    const ctx = gsap.context(() => {
      // Main Pinned Horizontal Slide Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinWrapper,
          start: 'top top',
          end: '+=150%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Fade out top luminous beam and border as section scrolls into the top half
      gsap.to(topBeamRef.current, {
        opacity: 0,
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: pinWrapper,
          start: 'top 50%',
          end: 'top 15%', // Faded fully before hitting the nav bar
          scrub: true,
        },
      });

      gsap.to(pinWrapper, {
        borderColor: 'transparent',
        boxShadow: 'none',
        ease: 'power1.inOut',
        scrollTrigger: {
          trigger: pinWrapper,
          start: 'top 50%',
          end: 'top 15%',
          scrub: true,
        },
      });

      // 0. Dead zone: Wait for Live Demo animation (maps to scroll distance)
      tl.to({}, { duration: 0.5 });

      // 1. Subtle depth push on base section as new card slides over
      tl.to(baseContainer, {
        scale: 0.94,
        xPercent: -10,
        opacity: 0.6,
        duration: 1,
        ease: 'power2.inOut',
      }, 0.5);

      let hasTriggered50 = false;

      // 2. Slide-over card glides horizontally over the base section from right to left
      tl.to(slideSheet, {
        xPercent: 0,
        scale: 1,
        rotateY: 0,
        duration: 1,
        ease: 'power2.inOut',
        onUpdate: function() {
          const progress = this.progress(); // 0 to 1 as card slides in
          
          // Broadcast progress so the base section can animate itself closing
          window.dispatchEvent(new CustomEvent('slide-overlay-progress', { detail: progress }));

          // Fade out the leading edge of the slide sheet as it hits the left edge of the screen
          if (leftBeamRef.current) {
            leftBeamRef.current.style.opacity = Math.max(0, 1 - (progress * 1.5));
          }
          if (slideSheetRef.current) {
             slideSheetRef.current.style.borderColor = `rgba(255, 91, 29, ${Math.max(0, 1 - (progress * 1.5))})`;
             // Flatten out the rounded corners as it fully covers the screen
             const radius = Math.max(0, 56 * (1 - Math.pow(progress, 4))); // stays rounded until very end
             slideSheetRef.current.style.borderTopLeftRadius = `${radius}px`;
             slideSheetRef.current.style.borderBottomLeftRadius = `${radius}px`;
          }

          // ✦ WHEN PAGE COMES TO 50%: Automatically glide slider 0% -> 50% (Underline draws 0% -> 100% in 1:1 sync) ✦
          if (progress >= 0.50 && !hasTriggered50) {
            hasTriggered50 = true;

            // Automatically animate comparison slider from 0% (5%) to 50%
            const sliderObj = { pos: 5 };
            gsap.to(sliderObj, {
              pos: 50,
              duration: 1.15,
              ease: 'power2.out',
              onUpdate: () => {
                const sliderEvent = new CustomEvent('slider-progress', { detail: sliderObj.pos });
                window.dispatchEvent(sliderEvent);
              }
            });
          } else if (progress < 0.20 && hasTriggered50) {
            hasTriggered50 = false;
            // Reset when scrolling back up
            const sliderEvent = new CustomEvent('slider-progress', { detail: 5 });
            window.dispatchEvent(sliderEvent);
          }
        }
      }, 0.5);

    }, pinWrapper);

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative z-30 w-full max-w-full -mt-[100svh]">
      <div
        ref={pinWrapperRef}
        id="section-interactive-showcase"
        className="w-full max-w-full overflow-hidden bg-[#FFF8F5] rounded-t-[40px] md:rounded-t-[60px] border-t-2 border-[#FF5B1D] block"
        style={{
          perspective: '2400px',
          boxShadow: '0 -28px 70px -15px rgba(0,0,0,0.18), 0 -10px 30px -5px rgba(0,0,0,0.12), 0 -2px 14px rgba(255,91,29,0.45), inset 0 1px 0 rgba(255,255,255,0.98)',
        }}
      >
        {/* Top Luminous Laser Beam */}
      <div
        ref={topBeamRef}
        aria-hidden="true"
        className="hidden lg:block absolute top-0 inset-x-0 h-[3px] pointer-events-none z-50"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,91,29,0.5) 10%, #FF5B1D 50%, rgba(255,91,29,0.5) 90%, transparent 100%)',
          boxShadow: '0 0 22px 3.5px rgba(255, 91, 29, 0.9), 0 2px 28px 5px rgba(255, 91, 29, 0.55)',
        }}
      />

      {/* ── Base Section (Live Demo - pinned in viewport) ── */}
      <div 
        ref={baseContainerRef} 
        className="relative w-full min-h-[100svh] flex flex-col justify-center will-change-transform z-10"
      >
        {baseSection}
      </div>

      {/* ── Sliding Layer (Difference Slider - slides LEFT from right) ── */}
      <div
        ref={slideSheetRef}
        className="absolute top-0 bottom-0 inset-x-0 w-full h-full z-30 bg-[#FFF8F5] rounded-l-[36px] border-l-2 border-[#FF5B1D] flex flex-col justify-start will-change-transform"
      >
        {/* Left Leading Edge Luminous Laser Beam */}
        <div
          ref={leftBeamRef}
          aria-hidden="true"
          className="hidden lg:block absolute top-0 bottom-0 left-0 w-[3.5px] pointer-events-none z-50"
          style={{
            background: 'linear-gradient(180deg, #FF5B1D 0%, rgba(255,91,29,0.85) 35%, rgba(255,91,29,0.2) 80%, transparent 100%)',
            boxShadow: '-4px 0 24px 4px rgba(255, 91, 29, 0.9), -2px 0 28px 6px rgba(255, 91, 29, 0.55)',
          }}
        />

        {/* Slide Section Content */}
        <div className="relative w-full h-full">
          <div className="sticky top-0 w-full h-[100svh] overflow-hidden flex flex-col justify-start">
            {slideSection}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

