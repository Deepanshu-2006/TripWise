'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const FRAME_COUNT = 240;

const Hero = () => {
    const containerRef = useRef(null);
    const stickyRef = useRef(null);
    const canvasRef = useRef(null);
    const framesRef = useRef([]); // Will hold ImageBitmap or HTMLImageElement objects
    
    // Smooth 60fps animation state
    const targetFrameIndexRef = useRef(0);
    const currentRenderedIndexRef = useRef(-1);

    // Overlay stage container refs
    const stage1Ref = useRef(null);
    const stage2Ref = useRef(null);
    const stage3Ref = useRef(null);
    const stage4Ref = useRef(null);
    const stage5Ref = useRef(null);
    const progressIndicatorRef = useRef(null);

    const [loadedCount, setLoadedCount] = useState(0);
    const [isFullyLoaded, setIsFullyLoaded] = useState(false);

    const getFrameUrl = (index) => `/frames/frame_${String(index + 1).padStart(3, '0')}.png`;

    // High performance draw routine
    const drawFrame = (index) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Find closest loaded frame if requested frame isn't ready
        let frameToDraw = framesRef.current[index];
        if (!frameToDraw) {
            for (let offset = 1; offset < FRAME_COUNT; offset++) {
                const lower = index - offset;
                const upper = index + offset;
                if (lower >= 0 && framesRef.current[lower]) {
                    frameToDraw = framesRef.current[lower];
                    break;
                }
                if (upper < FRAME_COUNT && framesRef.current[upper]) {
                    frameToDraw = framesRef.current[upper];
                    break;
                }
            }
        }

        if (!frameToDraw) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate aspect ratios for cinematic object-fit cover
        const canvasRatio = canvas.width / canvas.height;
        const imgWidth = frameToDraw.width;
        const imgHeight = frameToDraw.height;
        const imgRatio = imgWidth / imgHeight;
        let drawWidth, drawHeight, startX, startY;

        if (canvasRatio > imgRatio) {
            drawWidth = canvas.width;
            drawHeight = canvas.width / imgRatio;
            startX = 0;
            startY = (canvas.height - drawHeight) / 2;
        } else {
            drawHeight = canvas.height;
            drawWidth = canvas.height * imgRatio;
            startX = (canvas.width - drawWidth) / 2;
            startY = 0;
        }

        ctx.drawImage(frameToDraw, startX, startY, drawWidth, drawHeight);
        currentRenderedIndexRef.current = index;
    };

    // Animate stage overlays directly in DOM at 60fps to avoid React render lag
    const animateOverlays = (index) => {
        const progress = index / (FRAME_COUNT - 1);

        // Stage 1 (Phone Idle: 0.0 - 0.15 progress / frames 0 - 36)
        if (stage1Ref.current) {
            let opacity = 0;
            if (progress < 0.15) {
                // Fade in from 0 to 0.04, hold to 0.10, fade out to 0.15
                if (progress < 0.04) {
                    opacity = progress / 0.04;
                } else if (progress < 0.10) {
                    opacity = 1.0;
                } else {
                    opacity = 1.0 - (progress - 0.10) / 0.05;
                }
            }
            const y = (1.0 - opacity) * -20;
            stage1Ref.current.style.opacity = opacity;
            stage1Ref.current.style.transform = `translateY(${y}px)`;
            stage1Ref.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
        }

        // Stage 2 (Typing/Thinking: 0.15 - 0.38 progress / frames 36 - 91)
        if (stage2Ref.current) {
            let opacity = 0;
            if (progress >= 0.15 && progress < 0.38) {
                if (progress < 0.20) {
                    opacity = (progress - 0.15) / 0.05;
                } else if (progress < 0.32) {
                    opacity = 1.0;
                } else {
                    opacity = 1.0 - (progress - 0.32) / 0.06;
                }
            }
            const y = (1.0 - opacity) * 15;
            stage2Ref.current.style.opacity = opacity;
            stage2Ref.current.style.transform = `translateY(${y}px)`;
            stage2Ref.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';
        }

        // Stage 3 (Globe Spin-Up: 0.38 - 0.63 progress / frames 91 - 151)
        if (stage3Ref.current) {
            let opacity = 0;
            if (progress >= 0.38 && progress < 0.63) {
                if (progress < 0.44) {
                    opacity = (progress - 0.38) / 0.06;
                } else if (progress < 0.56) {
                    opacity = 1.0;
                } else {
                    opacity = 1.0 - (progress - 0.56) / 0.07;
                }
            }
            
            stage3Ref.current.style.opacity = opacity > 0.01 ? 1 : 0;
            stage3Ref.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';

            // Word-by-word reveal for Stage 3
            const words = stage3Ref.current.querySelectorAll('.stage3-word');
            const subLine = stage3Ref.current.querySelector('.stage3-sub');
            
            words.forEach((word, idx) => {
                // Stagger entrance based on progress inside the stage
                const wordThresh = idx / words.length;
                // Calculate word progress
                let wordProgress = 0;
                if (opacity > 0 && progress < 0.56) {
                    const stageProgress = (progress - 0.38) / 0.18; // relative to entrance
                    wordProgress = Math.min(1, Math.max(0, (stageProgress - wordThresh * 0.4) / 0.5));
                } else {
                    wordProgress = opacity; // fade out together
                }
                word.style.opacity = wordProgress;
                word.style.transform = `translateY(${(1.0 - wordProgress) * 20}px)`;
            });

            if (subLine) {
                let subProgress = 0;
                if (opacity > 0 && progress < 0.56) {
                    const stageProgress = (progress - 0.38) / 0.18;
                    subProgress = Math.min(1, Math.max(0, (stageProgress - 0.5) / 0.5));
                } else {
                    subProgress = opacity;
                }
                subLine.style.opacity = subProgress;
                subLine.style.transform = `translateY(${(1.0 - subProgress) * 15}px)`;
            }
        }

        // Stage 4 (Map Reveal: 0.63 - 0.83 progress / frames 151 - 199)
        if (stage4Ref.current) {
            let opacity = 0;
            if (progress >= 0.63 && progress < 0.83) {
                if (progress < 0.68) {
                    opacity = (progress - 0.63) / 0.05;
                } else if (progress < 0.77) {
                    opacity = 1.0;
                } else {
                    opacity = 1.0 - (progress - 0.77) / 0.06;
                }
            }
            
            stage4Ref.current.style.opacity = opacity > 0.01 ? 1 : 0;
            stage4Ref.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';

            const words = stage4Ref.current.querySelectorAll('.stage4-word');
            words.forEach((word, idx) => {
                const wordThresh = idx / words.length;
                let wordProgress = 0;
                if (opacity > 0 && progress < 0.77) {
                    const stageProgress = (progress - 0.63) / 0.14;
                    wordProgress = Math.min(1, Math.max(0, (stageProgress - wordThresh * 0.4) / 0.5));
                } else {
                    wordProgress = opacity;
                }
                word.style.opacity = wordProgress;
                word.style.transform = `translateY(${(1.0 - wordProgress) * 20}px)`;
            });
        }

        // Stage 5 (Itinerary Stacking: 0.83 - 1.0 progress / frames 199 - 239)
        if (stage5Ref.current) {
            let opacity = 0;
            if (progress >= 0.83) {
                opacity = Math.min(1.0, (progress - 0.83) / 0.09);
            }
            
            stage5Ref.current.style.opacity = opacity > 0.01 ? 1 : 0;
            stage5Ref.current.style.pointerEvents = opacity > 0.1 ? 'auto' : 'none';

            const heading = stage5Ref.current.querySelector('.stage5-heading');
            const cta = stage5Ref.current.querySelector('.stage5-cta');

            if (heading) {
                heading.style.opacity = opacity;
                heading.style.transform = `translateY(${(1.0 - opacity) * 20}px)`;
            }

            if (cta) {
                // CTA fades in later, once the last card lands (progress > 0.95)
                let ctaOpacity = 0;
                if (progress >= 0.94) {
                    ctaOpacity = Math.min(1.0, (progress - 0.94) / 0.05);
                }
                cta.style.opacity = ctaOpacity;
                cta.style.transform = `translateY(${(1.0 - ctaOpacity) * 15}px)`;
            }
        }

        // Update bottom progress bar indicator width
        if (progressIndicatorRef.current) {
            progressIndicatorRef.current.style.width = `${progress * 100}%`;
        }
    };

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        let loaded = 0;
        framesRef.current = new Array(FRAME_COUNT).fill(null);

        // Helper to load and decode a single frame into GPU texture (ImageBitmap) for 60+ FPS
        const loadFrame = async (i) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = getFrameUrl(i);
                img.onload = async () => {
                    try {
                        if (window.createImageBitmap) {
                            const bitmap = await window.createImageBitmap(img);
                            framesRef.current[i] = bitmap;
                        } else {
                            framesRef.current[i] = img;
                        }
                    } catch (e) {
                        framesRef.current[i] = img;
                    }
                    loaded++;
                    setLoadedCount(loaded);
                    if (loaded === 1 || i === 0) {
                        drawFrame(0);
                    }
                    if (loaded === FRAME_COUNT) {
                        setIsFullyLoaded(true);
                    }
                    resolve();
                };
                img.onerror = () => resolve();
            });
        };

        // Two-phase prioritized loading:
        // Phase 1: Load priority checkpoints immediately for instant display responsiveness
        const priorityIndices = new Set();
        for (let i = 0; i < Math.min(25, FRAME_COUNT); i++) priorityIndices.add(i);
        for (let i = 0; i < FRAME_COUNT; i += 8) priorityIndices.add(i);

        const runPreloader = async () => {
            // Load priority frames first
            await Promise.all(Array.from(priorityIndices).map((idx) => loadFrame(idx)));
            // Load remaining frames in small batches
            const remaining = [];
            for (let i = 0; i < FRAME_COUNT; i++) {
                if (!priorityIndices.has(i)) remaining.push(i);
            }
            const BATCH_SIZE = 12;
            for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
                const batch = remaining.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map((idx) => loadFrame(idx)));
            }
        };

        runPreloader();

        // Handle canvas sizing and responsiveness with high devicePixelRatio
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for optimal 60fps GPU performance
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            if (currentRenderedIndexRef.current >= 0) {
                drawFrame(currentRenderedIndexRef.current);
            } else {
                drawFrame(0);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        // 60 FPS Decoupled Render Loop (combines frame drawing + overlay animation)
        const renderLoop = () => {
            const target = targetFrameIndexRef.current;
            if (target !== currentRenderedIndexRef.current) {
                drawFrame(target);
                animateOverlays(target);
            }
        };
        gsap.ticker.add(renderLoop);

        // Set up GSAP ScrollTrigger across a 750vh runway for smooth scrubbing
        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: containerRef.current,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.15, // Tight 0.15s scrub for smooth momentum-feeling scroll
                pin: stickyRef.current,
                onUpdate: (self) => {
                    const progress = self.progress;
                    const frameIdx = Math.min(
                        FRAME_COUNT - 1,
                        Math.max(0, Math.round(progress * (FRAME_COUNT - 1)))
                    );
                    targetFrameIndexRef.current = frameIdx;
                }
            });
        }, containerRef);

        return () => {
            window.removeEventListener('resize', handleResize);
            gsap.ticker.remove(renderLoop);
            ctx.revert();
        };
    }, []);

    const loadingPercentage = Math.round((loadedCount / FRAME_COUNT) * 100);

    return (
        <section ref={containerRef} id="hero-section" className="relative w-full h-[750vh] bg-brand-sand">
            {/* Sticky Viewport Container */}
            <div ref={stickyRef} className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
                {/* Background Frame Canvas (GPU Accelerated 60 FPS) */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full z-0 pointer-events-none"
                />

                {/* Subtle Cinematic Vignette Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-brand-sand via-transparent to-brand-sand/30 pointer-events-none z-1" />

                {/* Loading Status Corner Pill */}
                {loadedCount < FRAME_COUNT && (
                    <div className="absolute top-24 right-6 z-50 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-brand-dark/10 flex items-center gap-2.5 shadow-md pointer-events-none">
                        <div className="w-2 h-2 rounded-full bg-brand-coral animate-ping" />
                        <span className="text-xs font-bold text-brand-dark">
                            Loading visual sequence: {loadingPercentage}%
                        </span>
                    </div>
                )}

                {/* TEXT AND INTERACTIVE OVERLAYS (STAGED RENDER) */}
                <div className="absolute inset-0 z-10 w-full h-full flex flex-col justify-between p-8 md:p-16 pointer-events-none select-none">
                    
                    {/* Header alignment spacer */}
                    <div className="w-full h-20" />

                    {/* Main overlays stage */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full relative">
                        
                        {/* STAGE 1: Phone Idle */}
                        <div 
                            ref={stage1Ref} 
                            className="absolute inset-0 flex flex-col items-center justify-center opacity-0 pointer-events-none transition-all duration-300 ease-out"
                        >
                            <p className="text-lg md:text-md font-bold text-[#fe7717] px-7 py-3.5 bg-[#1C1B1B] backdrop-blur-md rounded-full shadow-lg border border-white/50 translate-y-28 md:translate-y-26 font-mono ">
                                JUST TELL US WHERE YOU WANT TO GO...
                            </p>
                        </div>

                        {/* STAGE 2: Typing/Thinking Assistant Line */}
                        <div 
                            ref={stage2Ref} 
                            className="absolute inset-x-0 bottom-12 md:bottom-20 flex flex-col items-center opacity-0 pointer-events-none transition-all duration-300 ease-out"
                        >
                            <div className="flex items-center gap-4 px-7 py-3.5 bg-[#1C1B1B] backdrop-blur-md rounded-full shadow-lg border border-white/50 text-[#fe7717] font-mono text-lg md:text-md font-bold">
                                <span className="flex h-4 w-4 md:h-5 md:w-5 relative shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fe7717] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 md:h-5 md:w-5 bg-[#fe7717] animate-pulse"></span>
                                </span>
                                <span className="uppercase tracking-wide select-none">
                                    UNDERSTANDING YOUR DREAM TRIP
                                    <span className="dot-blink">.</span>
                                    <span className="dot-blink" style={{ animationDelay: '0.2s' }}>.</span>
                                    <span className="dot-blink" style={{ animationDelay: '0.4s' }}>.</span>
                                </span>
                            </div>
                        </div>

                        {/* STAGE 3: Globe Spin-Up Hero Headline (Staggered words) */}
                        <div 
                            ref={stage3Ref} 
                            className="absolute inset-0 flex flex-col items-center justify-center opacity-0 pointer-events-none max-w-2xl transition-all duration-300 ease-out"
                        >
                            <h2 className="text-4xl md:text-6xl font-extrabold text-brand-dark tracking-tight leading-[1.15] mb-4">
                                {['Your', 'AI', 'Travel', 'Planner,', 'Reimagined.'].map((word, idx) => (
                                    <span 
                                        key={idx} 
                                        className="stage3-word inline-block mr-[0.25em] transition-all duration-300 ease-out"
                                        style={{
                                            color: (idx === 1 || idx === 2) ? '#fe7717' : 'inherit'
                                        }}
                                    >
                                        {word}
                                    </span>
                                ))}
                            </h2>
                            <p className="uppercase stage3-sub text-[11px] md:text-xs font-bold text-[#fe7717] px-6 py-2.5 bg-[#1C1B1B] backdrop-blur-md rounded-full shadow-lg border border-white/20 font-mono tracking-[0.16em] transition-all duration-300 ease-out mt-6">
                                From a single sentence to a full itinerary
                            </p>
                        </div>

                        {/* STAGE 4: Map Reveal (Staggered words) */}
                        <div 
                            ref={stage4Ref} 
                            className="absolute inset-0 flex flex-col items-center justify-center opacity-0 pointer-events-none max-w-3xl transition-all duration-300 ease-out translate-x-6 md:translate-x-20"
                        >
                            <h2 className="text-4xl md:text-6xl font-extrabold text-brand-dark tracking-tight leading-[1.15]">
                                {['Real', 'Places.', 'Real', 'Plans.', 'Built', 'in', 'Seconds.'].map((word, idx) => (
                                    <span 
                                        key={idx} 
                                        className="stage4-word inline-block mr-[0.25em] transition-all duration-300 ease-out"
                                        style={{
                                            color: (idx === 0 || idx === 2) ? '#fe7717' : (idx === 6) ? 'var(--brand-teal)' : 'inherit'
                                        }}
                                    >
                                        {word}
                                    </span>
                                ))}
                            </h2>
                        </div>

                        {/* STAGE 5: Itinerary Cards Stacking & CTA */}
                        <div 
                            ref={stage5Ref} 
                            className="absolute inset-0 flex flex-col items-center justify-center opacity-0 pointer-events-none max-w-2xl transition-all duration-300 ease-out"
                        >
                            <h2 className="stage5-heading text-4xl md:text-5xl font-extrabold text-brand-dark tracking-tight mb-8 transition-all duration-300 ease-out">
                                Your <span className="text-[#fe7717]">Day-by-Day</span> Itinerary, <br />
                                <span className="text-brand-coral">Auto-Generated</span>
                            </h2>
                            <button className="stage5-cta pointer-events-auto px-8 py-4 bg-[#fe7717] hover:bg-brand-dark text-[#1C1B1B] font-extrabold text-lg rounded-full shadow-lg shadow-brand-coral/25 hover:shadow-brand-dark/25 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer font-mono tracking-widest ">
                                Plan My Trip →
                            </button>
                        </div>

                    </div>

                    {/* Bottom spacer */}
                    <div className="w-full h-12 flex justify-center items-center">
                        <div className="w-32 h-1 bg-brand-dark/10 rounded-full overflow-hidden">
                            <div 
                                ref={progressIndicatorRef}
                                className="h-full bg-brand-teal transition-all duration-100"
                                style={{ width: '0%' }}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Hero;