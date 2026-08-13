'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import WorldMap from './WorldMap';

/**
 * TravelTelemetryBackground
 * 
 * Bespoke luxury travel canvas background:
 * - Interactive high-DPI micro-starfield & atmospheric particle drift with mouse parallax
 * - SVG Geodesic flight trajectory arcs with traveling photon pulses connecting world hubs
 * - National Geographic-grade fine topographic elevation contour lines
 * - Subtle navigator telemetry coordinates & flight matrix telemetry badges
 * - Zero generic gradient blobs — 100% precision engineered cartography & aerospace aesthetics
 */
export default function TravelTelemetryBackground() {
  const canvasRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const wrapperRef = useRef(null);
  const spotlightRef = useRef(null);
  const labelLeftRef = useRef(null);
  const labelRightRef = useRef(null);
  const mapRef = useRef(null);

  // Scroll-scrubbed rise: labels track the section rising from the bottom
  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    const leftEl = labelLeftRef.current;
    const rightEl = labelRightRef.current;
    const triggerEl = wrapperRef.current;
    if (!leftEl || !rightEl || !triggerEl) return;

    // Start both labels hidden below their resting position
    gsap.set(leftEl,  { y: 48, opacity: 0 });
    gsap.set(rightEl, { y: 56, opacity: 0 });

    const ctx = gsap.context(() => {
      // Scrubbed timeline — labels physically track the section rising
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerEl,
          start: 'top bottom',   // section top hits viewport bottom
          end:   'top 40%',      // section top reaches 40% from top
          scrub: 1.2,            // smooth lag behind scroll
        },
      });

      tl.to(leftEl,  { y: 0, opacity: 1, ease: 'power2.out' }, 0);
      tl.to(rightEl, { y: 0, opacity: 1, ease: 'power2.out' }, 0.08); // slight offset
      
    }, triggerEl);

    return () => ctx.revert();

  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
      initStars();
    };

    window.addEventListener('resize', handleResize);

    // Track mouse for gentle celestial parallax
    const handleMouseMove = (e) => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update CSS variables ONLY on the spotlight div to prevent massive style recalcs on the SVG
      if (spotlightRef.current) {
        spotlightRef.current.style.setProperty('--mouse-x', `${x}px`);
        spotlightRef.current.style.setProperty('--mouse-y', `${y}px`);
      }
      
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      mousePos.current.targetX = relX * 40;
      mousePos.current.targetY = relY * 40;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Initialize starry constellation points
    const stars = [];
    const numStars = Math.min(Math.floor((width * height) / 12000), 120);

    const initStars = () => {
      stars.length = 0;
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.4 + 0.4,
          baseAlpha: Math.random() * 0.55 + 0.15,
          alpha: Math.random() * 0.55 + 0.15,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          color: Math.random() > 0.85 ? '#FF8A5B' : Math.random() > 0.7 ? '#FFB380' : '#FFFFFF'
        });
      }
    };

    initStars();

    // Render loop
    const render = () => {
      // Smooth mouse lerp
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.05;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Render micro-stars
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Move gently
        star.x += star.vx;
        star.y += star.vy;
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        // Twinkle
        star.twinklePhase += star.twinkleSpeed;
        const currentAlpha = star.baseAlpha + Math.sin(star.twinklePhase) * 0.25;
        const boundedAlpha = Math.max(0.05, Math.min(1, currentAlpha));

        const drawX = star.x + mousePos.current.x * (star.radius * 0.4);
        const drawY = star.y + mousePos.current.y * (star.radius * 0.4);

        // Spotlight effect logic: stars closer to mouse are brighter
        const dx = drawX - mousePos.current.x;
        const dy = drawY - mousePos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const spotlightMultiplier = Math.max(1, 2.5 * (1 - dist / 300)); // boost brightness near mouse

        ctx.beginPath();
        ctx.arc(drawX, drawY, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color === '#FFFFFF' 
          ? `rgba(255, 255, 255, ${Math.min(1, boundedAlpha * spotlightMultiplier)})` 
          : star.color === '#FF8A5B'
          ? `rgba(255, 138, 91, ${Math.min(1, boundedAlpha * spotlightMultiplier)})`
          : `rgba(255, 179, 128, ${Math.min(1, boundedAlpha * spotlightMultiplier)})`;
        ctx.fill();

        // Subtle glow for larger stars
        if (star.radius > 1.2) {
          ctx.beginPath();
          ctx.arc(drawX, drawY, star.radius * 3.5 * spotlightMultiplier, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 91, 29, ${boundedAlpha * 0.12 * spotlightMultiplier})`;
          ctx.fill();
        }
      }

      // Parallax World Map (hardware accelerated)
      if (mapRef.current) {
        mapRef.current.style.transform = `translate3d(${mousePos.current.x * 0.1}px, ${mousePos.current.y * 0.1}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="absolute inset-0 pointer-events-none overflow-hidden select-none bg-[#070709]">
      {/* 1. Fine National Geographic Cartographic Grid */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* 2. Bespoke Topographic Contour Vector Waves */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-[0.06] text-white" 
        xmlns="http://www.w3.org/2000/svg" 
        preserveAspectRatio="none"
        viewBox="0 0 1440 800"
      >
        <path d="M-100,180 C300,120 450,280 850,210 C1250,140 1350,300 1600,240" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 6" />
        <path d="M-100,260 C250,200 500,380 900,290 C1300,200 1400,380 1600,320" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M-100,340 C200,280 550,480 950,370 C1350,260 1450,460 1600,400" fill="none" stroke="#FF5B1D" strokeWidth="1" strokeDasharray="6 8" />
        <path d="M-100,420 C150,360 600,580 1000,450 C1400,320 1500,540 1600,480" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M-100,500 C100,440 650,680 1050,530 C1450,380 1550,620 1600,560" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 5" />
        <path d="M-100,580 C50,520 700,780 1100,610 C1500,440 1600,700 1600,640" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* 2.5. Animated Vector World Map */}
      <div 
        className="absolute inset-0 w-full h-full flex items-center justify-center opacity-40 z-0 overflow-hidden pointer-events-none" 
        style={{ 
          willChange: 'transform'
        }}
      >
        <WorldMap className="w-[140%] h-[140%] max-w-none will-change-transform" pathRef={mapRef} />
      </div>

      {/* 2.7. Performant CSS Mouse Spotlight */}
      <div 
        ref={spotlightRef}
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 91, 29, 0.06), transparent 80%)`
        }}
      />

      {/* 3. Interactive Starfield Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* 4. Animated Geodesic Flight Trajectories & Waypoints */}
      <svg 
        className="absolute inset-0 w-full h-full overflow-visible z-10 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg" 
        preserveAspectRatio="none"
        viewBox="0 0 1440 800"
      >
        <defs>
          <linearGradient id="flightGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,91,29,0)" />
            <stop offset="50%" stopColor="rgba(255,91,29,0.8)" />
            <stop offset="100%" stopColor="rgba(255,91,29,0)" />
          </linearGradient>
          <linearGradient id="flightGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(56,189,248,0)" />
            <stop offset="80%" stopColor="rgba(56,189,248,0.6)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0)" />
          </linearGradient>
          <linearGradient id="flightGrad3" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,160,122,0)" />
            <stop offset="50%" stopColor="rgba(255,160,122,0.7)" />
            <stop offset="100%" stopColor="rgba(255,160,122,0)" />
          </linearGradient>

          <filter id="beaconGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Flight Trajectory Arc 1: Tokyo (TYO) -> Paris (CDG) */}
        <g className="opacity-75">
          <path 
            id="flightPath1" 
            d="M 120,620 Q 420,160 820,380 T 1360,220" 
            fill="none" 
            stroke="url(#flightGrad1)" 
            strokeWidth="1.75" 
            strokeDasharray="8 6"
          >
            <animate attributeName="stroke-dashoffset" values="14;0" dur="0.8s" repeatCount="indefinite" />
          </path>
          {/* Animated Photon Pulse Traveling Path 1 */}
          <circle r="3.5" fill="#FFFFFF" filter="url(#beaconGlow)">
            <animateMotion dur="14s" repeatCount="indefinite" path="M 120,620 Q 420,160 820,380 T 1360,220" />
          </circle>
          <circle r="10" fill="none" stroke="#FF5B1D" strokeWidth="1" opacity="0.6" filter="url(#beaconGlow)">
            <animateMotion dur="14s" repeatCount="indefinite" path="M 120,620 Q 420,160 820,380 T 1360,220" />
          </circle>
        </g>

        {/* Flight Trajectory Arc 2: New York (JFK) -> Zurich (ZRH) */}
        <g className="opacity-55">
          <path 
            id="flightPath2" 
            d="M 80,240 Q 560,540 1020,180 T 1400,580" 
            fill="none" 
            stroke="url(#flightGrad2)" 
            strokeWidth="1.5" 
            strokeDasharray="5 7"
          >
            <animate attributeName="stroke-dashoffset" values="12;0" dur="0.9s" repeatCount="indefinite" />
          </path>
          {/* Animated Photon Pulse Traveling Path 2 */}
          <circle r="3" fill="#38BDF8" filter="url(#beaconGlow)">
            <animateMotion dur="18s" repeatCount="indefinite" path="M 80,240 Q 560,540 1020,180 T 1400,580" />
          </circle>
        </g>

        {/* Flight Trajectory Arc 3: Reykjavik (KEF) -> Amalfi (NAP) */}
        <g className="opacity-65">
          <path 
            id="flightPath3" 
            d="M 220,160 Q 720,80 1260,680" 
            fill="none" 
            stroke="url(#flightGrad3)" 
            strokeWidth="1.5" 
            strokeDasharray="10 8"
          >
            <animate attributeName="stroke-dashoffset" values="18;0" dur="1s" repeatCount="indefinite" />
          </path>
          {/* Animated Photon Pulse Traveling Path 3 */}
          <circle r="3" fill="#FFA07A" filter="url(#beaconGlow)">
            <animateMotion dur="11s" repeatCount="indefinite" path="M 220,160 Q 720,80 1260,680" />
          </circle>
        </g>

        {/* Global Hub Waypoint 1 — TYO / Tokyo */}
        <g transform="translate(120, 620)" className="group cursor-pointer pointer-events-auto transition-transform hover:scale-125 duration-300">
          <circle r="3" fill="#FF5B1D" className="group-hover:fill-white transition-colors duration-300" />
          <circle r="8" fill="none" stroke="#FF5B1D" strokeWidth="1" className="group-hover:stroke-white transition-colors duration-300 opacity-70">
            <animate attributeName="r" values="3;24;3" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x="12" y="4" fill="#9CA3AF" fontSize="10" fontFamily="monospace" fontWeight="600" letterSpacing="1" className="group-hover:fill-white transition-colors duration-300">TYO • 35.6762° N</text>
        </g>

        {/* Global Hub Waypoint 2 — CDG / Paris */}
        <g transform="translate(820, 380)" className="group cursor-pointer pointer-events-auto transition-transform hover:scale-125 duration-300">
          <circle r="3.5" fill="#FF8A5B" className="group-hover:fill-white transition-colors duration-300" />
          <circle r="9" fill="none" stroke="#FF8A5B" strokeWidth="1" className="group-hover:stroke-white transition-colors duration-300 opacity-60">
            <animate attributeName="r" values="3;28;3" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <text x="12" y="-4" fill="#E5E7EB" fontSize="11" fontFamily="monospace" fontWeight="700" letterSpacing="1.5" className="group-hover:fill-white transition-colors duration-300">CDG • HUB 01</text>
        </g>

        {/* Global Hub Waypoint 3 — JFK / New York */}
        <g transform="translate(1360, 220)" className="group cursor-pointer pointer-events-auto transition-transform hover:scale-125 duration-300">
          <circle r="3" fill="#FF5B1D" className="group-hover:fill-white transition-colors duration-300" />
          <circle r="8" fill="none" stroke="#FF5B1D" strokeWidth="1" className="group-hover:stroke-white transition-colors duration-300 opacity-70">
            <animate attributeName="r" values="3;22;3" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <text x="-95" y="4" fill="#9CA3AF" fontSize="10" fontFamily="monospace" fontWeight="600" letterSpacing="1" className="group-hover:fill-white transition-colors duration-300">JFK • 40.7128° N</text>
        </g>

        {/* Global Hub Waypoint 4 — ZRH / Zurich */}
        <g transform="translate(1020, 180)" className="group cursor-pointer pointer-events-auto transition-transform hover:scale-125 duration-300">
          <circle r="2.5" fill="#38BDF8" className="group-hover:fill-white transition-colors duration-300" />
          <circle r="7" fill="none" stroke="#38BDF8" strokeWidth="1" className="group-hover:stroke-white transition-colors duration-300 opacity-70">
            <animate attributeName="r" values="2;18;2" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x="10" y="4" fill="#9CA3AF" fontSize="9" fontFamily="monospace" fontWeight="600" letterSpacing="1" className="group-hover:fill-white transition-colors duration-300">ZRH • ALT 432M</text>
        </g>

        {/* Global Hub Waypoint 5 — KEF / Reykjavik */}
        <g transform="translate(220, 160)" className="group cursor-pointer pointer-events-auto transition-transform hover:scale-125 duration-300">
          <circle r="2.5" fill="#818CF8" className="group-hover:fill-white transition-colors duration-300" />
          <circle r="7" fill="none" stroke="#818CF8" strokeWidth="1" className="group-hover:stroke-white transition-colors duration-300 opacity-70">
            <animate attributeName="r" values="2;16;2" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <text x="10" y="4" fill="#9CA3AF" fontSize="9" fontFamily="monospace" fontWeight="600" letterSpacing="1" className="group-hover:fill-white transition-colors duration-300">KEF • 64.1466° N</text>
        </g>
      </svg>




      <div
        ref={labelLeftRef}
        className="absolute bottom-8 left-8 hidden lg:flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest will-change-transform"
      >
        <span>NAV TELEMETRY v4.8.2 // TRIP ENGINE READY</span>
      </div>

      <div
        ref={labelRightRef}
        className="absolute bottom-8 right-8 hidden lg:flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest will-change-transform"
      >
        <span>PRECISION ROUTING // 0.00s LATENCY</span>
      </div>
    </div>
  );
}
