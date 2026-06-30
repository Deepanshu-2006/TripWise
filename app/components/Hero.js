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
        // Phase 1: Load every 10th frame and first 20 frames immediately for instant responsiveness
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

        // 60 FPS Render Loop decoupled from ScrollTrigger callback
        const renderLoop = () => {
            const target = targetFrameIndexRef.current;
            if (target !== currentRenderedIndexRef.current) {
                drawFrame(target);
            }
        };
        gsap.ticker.add(renderLoop);

        // Set up GSAP ScrollTrigger across a 700vh runway for ultra-smooth scrubbing
        const ctx = gsap.context(() => {
            ScrollTrigger.create({
                trigger: containerRef.current,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.15, // Tight 0.15s scrub for snappy 60fps responsiveness
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

    return (
        <section ref={containerRef} className="relative w-full h-[700vh] bg-brand-sand">
            {/* Sticky Viewport Container */}
            <div ref={stickyRef} className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
                {/* Background Frame Canvas (GPU Accelerated 60 FPS) */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full z-0 pointer-events-none"
                />

                {/* Subtle Cinematic Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-sand via-transparent to-brand-sand/30 pointer-events-none z-1" />
            </div>
        </section>
    );
};

export default Hero;