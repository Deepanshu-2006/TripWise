'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function ColorMorphWrapper({ children }) {
    const containerRef = useRef(null);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            const sections = gsap.utils.toArray('[data-color]');

            sections.forEach((section) => {
                const color = section.getAttribute('data-color');
                
                ScrollTrigger.create({
                    trigger: section,
                    start: 'top 50%',
                    end: 'bottom 50%',
                    onEnter: () => gsap.to(containerRef.current, { backgroundColor: color, duration: 0.8, overwrite: 'auto', ease: 'power2.out' }),
                    onEnterBack: () => gsap.to(containerRef.current, { backgroundColor: color, duration: 0.8, overwrite: 'auto', ease: 'power2.out' }),
                });
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    // Provide a default background color that matches the initial Hero state
    return (
        <div ref={containerRef} className="w-full min-h-screen bg-[#FFF8F5]">
            {children}
        </div>
    );
}
