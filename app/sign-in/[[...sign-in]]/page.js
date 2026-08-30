'use client';

import React, { useState, useEffect } from 'react';
import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

// --- Sub-components ---

// Volumetric Dust Particles Effect
const DustParticles = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20" style={{ clipPath: 'polygon(40% 0, 60% 0, 100% 100%, 0% 100%)' }}>
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-[#FFF2B2] rounded-full blur-[2px]"
          initial={{ 
            x: Math.random() * 800, 
            y: Math.random() * 600 + 100,
            opacity: 0,
            scale: Math.random() * 1.5 + 0.5
          }}
          animate={{
            y: [null, Math.random() * -300 - 100],
            x: [null, (Math.random() - 0.5) * 150 + (Math.random() * 800)],
            opacity: [0, Math.random() * 0.6 + 0.2, 0]
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 5
          }}
        />
      ))}
    </div>
  );
};

// --- Main Page ---

export default function SignInPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLightOn, setIsLightOn] = useState(false);
  
  // Motion Values
  const dragY = useMotionValue(0);
  const stringRotate = useMotionValue(0);
  
  // Derived Transforms
  const dragOpacity = useTransform(dragY, [0, 100], [0, 1]);
  const textOpacity = useTransform(dragY, [0, 40], [1, 0]);
  const formY = useTransform(dragY, [0, 100], [20, 0]);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Sound Effect Synthesis (Highly Realistic Mechanical Switch)
  const playClickSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      
      // 1. The "Thud" (Low frequency physical impact)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      
      // Quick pitch drop for a heavy, tactile feel
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.04); 
      
      oscGain.gain.setValueAtTime(1, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      
      // 2. The "Snap" (High frequency mechanical click using white noise)
      const bufferSize = ctx.sampleRate * 0.05; // 50ms buffer
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      // Filter the static to sound like a metallic/plastic snap
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 5000;
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);
      
      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      // Play both simultaneously
      osc.start();
      noise.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  };

  const handleDragEnd = (e, info) => {
    // 1. Check if pulled hard enough to toggle light
    if (info.offset.y > 50) {
      if (!isLightOn) {
        playClickSound();
        setIsLightOn(true);
      }
    }
    
    // 2. Trigger pendulum swing physics (horizontal)
    animate(stringRotate, [15, 0], {
      type: "spring",
      stiffness: 150,
      damping: 4
    });

    // 3. Trigger vertical 'jerk' physics (bouncing up and down)
    animate(dragY, 0, {
      type: "spring",
      stiffness: 500, // High stiffness for a fast snap
      damping: 6,     // Low damping for bouncing
      mass: 1
    });
  };

  // Dynamic Shadow for the Form (Long shadow to the right)
  const formShadow = 'inset 0 1px 20px rgba(255,255,255,0.03), 120px 60px 100px -20px rgba(0,0,0,0.9), 20px 20px 40px rgba(0,0,0,0.6)';

  if (!isMounted) {
    return <div className="min-h-screen bg-[#030303]" />;
  }

  if (isMobile) {
    // 4 separate sets of unique photos — no repeats across any carousel
    const topImages = [
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&fit=crop", // sunlit forest
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop", // tropical beach
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&auto=format&fit=crop", // swiss mountains
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&auto=format&fit=crop", // paris at night
    ];
    const bottomImages = [
      "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&auto=format&fit=crop", // tokyo city night
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop", // mountain lake
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&auto=format&fit=crop", // beach waves sunset
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&auto=format&fit=crop", // aerial mountains
    ];
    const leftImages = [
      "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format&fit=crop", // taj mahal
      "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&auto=format&fit=crop", // venice canal
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&auto=format&fit=crop", // iceland northern lights
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&auto=format&fit=crop", // italy fields
    ];
    const rightImages = [
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=600&auto=format&fit=crop", // india colorful
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&auto=format&fit=crop", // new york skyline
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&auto=format&fit=crop", // bali resort pool
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600&auto=format&fit=crop", // santorini greece
    ];

    return (
      <div className="min-h-[100dvh] flex flex-col bg-[#050505] relative overflow-hidden">

        {/* Pure CSS keyframe animations — zero JS, pure GPU */}
        <style>{`
          @keyframes scrollLeft {
            0%   { transform: translateX(0) translateZ(0); }
            100% { transform: translateX(-50%) translateZ(0); }
          }
          @keyframes scrollRight {
            0%   { transform: translateX(-50%) translateZ(0); }
            100% { transform: translateX(0) translateZ(0); }
          }
          @keyframes scrollUp {
            0%   { transform: translateY(0) translateZ(0); }
            100% { transform: translateY(-50%) translateZ(0); }
          }
          @keyframes scrollDown {
            0%   { transform: translateY(-50%) translateZ(0); }
            100% { transform: translateY(0) translateZ(0); }
          }
          .strip-top    { animation: scrollLeft  28s linear infinite; will-change: transform; }
          .strip-bottom { animation: scrollRight 28s linear infinite; will-change: transform; }
          .strip-left   { animation: scrollUp    22s linear infinite; will-change: transform; }
          .strip-right  { animation: scrollDown  22s linear infinite; will-change: transform; }
        `}</style>
        
        {/* 4 Clockwise Carousel Strips — pure CSS, GPU composited */}
        <div className="absolute top-0 left-0 w-full h-[100dvh] overflow-hidden bg-[#050505]">

          {/* TOP → left to right */}
          <div className="absolute top-0 left-0 w-full h-[18vh] overflow-hidden">
            <div className="strip-top flex h-full w-max gap-2 items-center px-1">
              {[...topImages, ...topImages].map((src, i) => (
                <div key={`t${i}`} className="flex-shrink-0 w-[42vw] h-[14vh] rounded-2xl overflow-hidden border border-white/10">
                  <img src={src} alt="" className="w-full h-full object-cover opacity-80" loading="eager" decoding="async" />
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM ← right to left */}
          <div className="absolute bottom-0 left-0 w-full h-[18vh] overflow-hidden">
            <div className="strip-bottom flex h-full w-max gap-2 items-center px-1">
              {[...bottomImages, ...bottomImages].map((src, i) => (
                <div key={`b${i}`} className="flex-shrink-0 w-[42vw] h-[14vh] rounded-2xl overflow-hidden border border-white/10">
                  <img src={src} alt="" className="w-full h-full object-cover opacity-80" loading="eager" decoding="async" />
                </div>
              ))}
            </div>
          </div>

          {/* LEFT ↑ bottom to top */}
          <div className="absolute left-[-5vw] top-0 w-[42vw] h-[100dvh] overflow-hidden">
            <div className="strip-left flex flex-col w-full h-max gap-2 py-1">
              {[...leftImages, ...leftImages].map((src, i) => (
                <div key={`l${i}`} className="flex-shrink-0 w-full h-[14vh] rounded-2xl overflow-hidden border border-white/10">
                  <img src={src} alt="" className="w-full h-full object-cover opacity-80" loading="eager" decoding="async" />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT ↓ top to bottom */}
          <div className="absolute right-[-5vw] top-0 w-[42vw] h-[100dvh] overflow-hidden">
            <div className="strip-right flex flex-col w-full h-max gap-2 py-1">
              {[...rightImages, ...rightImages].map((src, i) => (
                <div key={`r${i}`} className="flex-shrink-0 w-full h-[14vh] rounded-2xl overflow-hidden border border-white/10">
                  <img src={src} alt="" className="w-full h-full object-cover opacity-80" loading="eager" decoding="async" />
                </div>
              ))}
            </div>
          </div>

          {/* Dark center so form pops */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.65)_25%,transparent_100%)] pointer-events-none" />
          {/* Edge feather */}
          <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(5,5,5,1)] pointer-events-none" />
        </div>

        {/* Center: Apple Liquid Glass Premium Form */}
        <div className="flex-1 flex flex-col justify-center px-4 relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.25, delay: 0.1 }}
            className="w-full bg-white/40 backdrop-blur-3xl backdrop-saturate-150 shadow-[0_40px_80px_rgba(0,0,0,0.4)] rounded-[32px] p-5 sm:p-6 relative"
          >
            {/* Apple Liquid Glass Layering: Gradient border, specular inset highlight, and glossy shine */}
            <div className="absolute inset-0 rounded-[32px] border border-white/60 pointer-events-none" />
            <div className="absolute inset-0 rounded-[32px] shadow-[inset_0_1px_1px_rgba(255,255,255,1),inset_0_24px_48px_rgba(255,255,255,0.3)] bg-gradient-to-br from-white/30 via-transparent to-white/10 pointer-events-none" />

            {/* Logo and Creative Copy */}
            <div className="mb-6 mt-1 flex flex-col items-center text-center relative z-10">
              <div className="flex items-center justify-center select-none -ml-1 mb-2">
                 <div className="h-14 w-14 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 object-contain">
                        <path
                            d="M24 170 C 70 135, 105 105, 168 42"
                            fill="none"
                            stroke="#8CA3A8"
                            strokeWidth="4"
                            strokeDasharray="3 12"
                            strokeLinecap="round"
                        />
                        <circle cx="24" cy="170" r="9" fill="#0D9488" />
                        <g transform="translate(136,28) rotate(45)">
                            <path
                                d="M0 34 L8 0 L16 34 L34 44 L34 52 L16 46 L13 64 L21 70 L21 76 L8 70 L-5 76 L-5 70 L3 64 L0 46 L-18 52 L-18 44 Z"
                                fill="#fe7717"
                            />
                        </g>
                    </svg>
                 </div>
                 <div className="flex flex-col items-start -ml-2">
                    <span className="font-sans font-extrabold text-[26px] tracking-tight leading-none text-[#1C1B1B]">
                        Trip<span className="text-[#FF6B2C]">Wise</span>
                    </span>
                    <span className="font-sans font-bold text-[8px] tracking-[0.2em] text-[#8CA3A8] mt-1 leading-none">
                        AI TRIP PLANNER
                    </span>
                 </div>
              </div>
              <p className="text-[#1C1B1B]/70 text-[13px] font-medium leading-relaxed px-2">
                Unlock AI-crafted itineraries and discover hidden gems.
              </p>
            </div>

            <div className="relative z-10">
              <SignIn 
                  appearance={{
                    variables: {
                      colorPrimary: '#fe7717',
                      colorBackground: '#FFF8F5', 
                      colorInputBackground: 'rgba(255,255,255,0.8)',
                      colorInputText: '#1C1B1B',
                      colorText: '#1C1B1B',
                      colorTextSecondary: '#666666',
                    },
                    elements: {
                      rootBox: "!w-full",
                      cardBox: "!shadow-none !border-none !bg-transparent !w-full !max-w-full !overflow-visible",
                      card: "!bg-transparent !shadow-none !border-none !p-0 !w-full !max-w-full !overflow-visible",
                      main: "!w-full !max-w-full !p-0 !overflow-visible",
                      headerTitle: "!hidden",
                      headerSubtitle: "!hidden", 
                      formButtonPrimary: "!bg-[#1C1B1B] hover:!bg-[#1C1B1B]/90 !text-white !text-[14px] !font-bold !rounded-2xl !py-3.5 !mt-1 transition-all !shadow-lg !shadow-black/10 !border-none !w-full",
                      formFieldLabel: "!hidden", 
                      formFieldInput: "!bg-white/80 !border !border-white/60 !text-[#1C1B1B] !rounded-2xl !px-5 !py-3.5 !mb-3 focus:!ring-2 focus:!ring-[#fe7717]/40 focus:!border-[#fe7717] placeholder:!text-black/40 transition-all !w-full !text-[14.5px] !shadow-sm",
                      footer: "!bg-transparent !p-0 !mt-4",
                      footerActionText: "!text-black/50 !text-[13px]",
                      footerActionLink: "!text-[#1C1B1B] hover:!text-[#fe7717] !text-[13px] !font-bold",
                      socialButtonsBlockButton: "!bg-white/80 !border !border-white/60 hover:!bg-white !text-[#1C1B1B] transition-all !rounded-2xl !py-3.5 !w-full !mb-2.5 !shadow-sm",
                      socialButtonsBlockButtonText: "!font-sans !font-bold !text-[14.5px] !text-[#1C1B1B]",
                      dividerLine: "!bg-black/10",
                      dividerText: "!text-black/40 !font-sans !text-[12px] !px-4",
                      formFieldAction: "!text-[#fe7717] hover:!text-[#e56814] !text-xs !font-bold !absolute !right-4 !top-0 !-mt-6",
                      identityPreviewText: "!text-[#1C1B1B]",
                      identityPreviewEditButton: "!text-[#fe7717]"
                    }
                  }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#030303] relative overflow-hidden transition-colors duration-1000">
      
      {/* Ambient Room Lighting Layer (Warm glow spreading across the room) */}
      <motion.div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,210,120,0.08),transparent_70%)] pointer-events-none"
        style={{ opacity: isLightOn ? 1 : dragOpacity }}
        animate={isLightOn ? { opacity: [0, 0.8, 0.3, 1] } : undefined}
        transition={{ duration: 0.5, times: [0, 0.1, 0.3, 1] }} 
      />
      
      {/* Mobile Background Image (TripWise Vibe) */}
      <motion.div 
        className="md:hidden absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity" 
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop)' }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      <div className="md:hidden absolute inset-0 bg-linear-to-t from-[#030303] via-[#030303]/80 to-[#030303]/40 z-0 pointer-events-none" />

      {/* Mobile Branding (TripWise Logo) */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="md:hidden absolute top-12 left-0 right-0 z-20 flex flex-col items-center justify-center pointer-events-none"
      >
        <span className="font-sans font-extrabold text-[26px] tracking-tight leading-none text-white select-none">
          Trip<span className="text-[#FF6B2C]">Wise</span>
        </span>
        <span className="font-sans font-bold text-[8px] tracking-[0.3em] text-[#8CA3A8] select-none mt-1.5 leading-none">
          AI TRIP PLANNER
        </span>
      </motion.div>

      {/* Top Instruction Text */}
      {!isLightOn && (
        <motion.div 
          className="hidden md:block absolute top-24 text-stone-600 font-sans text-[11px] font-bold tracking-[0.3em] uppercase pointer-events-none"
          style={{ opacity: textOpacity }}
        >
          Pull the string to toggle login
        </motion.div>
      )}

      {/* Main Content Layout */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row items-center justify-center md:justify-between px-4 md:px-10 gap-0 md:gap-20 min-h-svh md:min-h-0">
        
        {/* Left Side: Floor Lamp */}
        <div className="hidden md:flex absolute md:relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:top-auto md:left-auto w-100 md:w-full md:max-w-100 h-150 md:h-150 flex-col items-center justify-end pointer-events-none md:pointer-events-auto scale-[0.7] sm:scale-[0.8] md:scale-100 z-10 md:z-auto origin-center">
          
          {/* The Light Beam Container */}
          <motion.div 
            className="absolute top-7 w-200 h-162.5 pointer-events-none origin-top mix-blend-screen"
            style={{ 
              opacity: isLightOn ? 1 : dragOpacity
            }}
            animate={isLightOn ? { opacity: [0, 1, 0.4, 1] } : undefined}
            transition={{ opacity: { duration: 0.4, times: [0, 0.1, 0.2, 1] } }}
          >
            {/* Core intense beam */}
            <div 
              className="absolute inset-0 bg-linear-to-b from-[#FFF2B2]/60 to-transparent blur-xs z-10"
              style={{ clipPath: 'polygon(46% 0, 54% 0, 80% 100%, 20% 100%)' }} 
            />
            {/* Soft, wide volumetric scatter */}
            <div 
              className="absolute inset-0 bg-linear-to-b from-[#FFD875]/20 to-transparent blur-3xl z-0"
              style={{ clipPath: 'polygon(40% 0, 60% 0, 100% 100%, 0% 100%)' }} 
            />
            
            {/* Volumetric Dust Particles */}
            <DustParticles isVisible={isLightOn} />
          </motion.div>
          
          {/* Lamp Hardware (Premium Metallic Silhouette) */}
          <div className="relative flex flex-col items-center w-full h-full z-20">
            
            {/* Lamp Head (Ultra-thin disc with metallic rim and highlight) */}
            <div className="w-72 h-3.5 bg-linear-to-b from-[#222222] to-[#050505] rounded-[100%] absolute top-3.75 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.9)] border-t border-white/8" />
            
            {/* Inner Bulb Housing (Physical structure under the head) */}
            <div className="w-32 h-2.5 bg-linear-to-b from-[#111111] to-[#0A0A0A] rounded-b-[100%] absolute top-4.5 z-20" />
            
            {/* Glowing Bulb (Radiates light) */}
            <motion.div 
              className="w-32 h-5 bg-[#FFF5C2] rounded-full absolute top-4.5 blur-[10px] z-20"
              style={{ opacity: isLightOn ? 1 : dragOpacity }}
              animate={isLightOn ? { opacity: [0, 1, 0.5, 1] } : undefined}
              transition={{ duration: 0.4 }}
            />
            
            {/* Lamp Pole (Tubular metallic gradient) */}
            <div className="w-2 h-140 bg-linear-to-r from-[#050505] via-[#2A2A2A] to-[#050505] absolute top-5 z-30 border-l border-white/3" />
            
            {/* Lamp Base (Heavy multi-layered beveled base) */}
            <div className="absolute bottom-0 z-30 flex flex-col items-center">
              {/* Sloped upper base */}
              <div className="w-32 h-3 bg-linear-to-b from-[#222222] to-[#111111] rounded-t-[100%] border-t border-white/5" />
              {/* Heavy block base */}
              <div className="w-48 h-4 bg-[#0A0A0A] rounded-t-sm shadow-[0_10px_30px_rgba(0,0,0,1)] border-t border-white/8" />
            </div>

            {/* The Pull String (with Pendulum Physics) */}
            <motion.div
              style={{ 
                originY: 0, 
                rotate: stringRotate, 
                x: 110 // Shifted slightly further out for the wider 72px head
              }}
              className={`absolute top-5.5 z-40 flex flex-col items-center pointer-events-auto ${isLightOn ? 'cursor-default pointer-events-none' : 'cursor-grab active:cursor-grabbing'}`}
            >
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 80 }}
                dragElastic={0.1}
                style={{ y: dragY }}
                onDragEnd={handleDragEnd}
                className="w-0.5 h-40 bg-linear-to-r from-[#111] via-[#444] to-[#111] shadow-xl flex flex-col items-center justify-end"
              >
                {/* Handle (Metallic brass finish) */}
                <div className="w-4 h-7 bg-linear-to-br from-[#FFD275] via-[#C9902E] to-[#664610] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] absolute -bottom-3 border border-[#FFD275]/40" />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Ultra-Premium Login Form */}
        <motion.div 
          className="relative z-30 w-full max-w-90 sm:max-w-none sm:w-105 md:w-105 shrink-0 p-4 sm:p-8 md:p-10 rounded-3xl md:rounded-4xl bg-[#111111]/85 border border-white/5 backdrop-blur-3xl mx-auto md:mx-0 shadow-2xl max-md:opacity-100! max-md:translate-y-0! max-md:pointer-events-auto!"
          style={{ 
            opacity: isLightOn ? 1 : dragOpacity,
            y: isLightOn ? 0 : formY,
            pointerEvents: isLightOn ? 'auto' : 'none',
            // Apply the dynamic long shadow when light is on
            boxShadow: isLightOn ? formShadow : '0 10px 40px rgba(0,0,0,0.5)'
          }}
          animate={{ 
            opacity: isLightOn ? 1 : undefined,
            y: isLightOn ? 0 : undefined,
            boxShadow: isLightOn ? formShadow : undefined
          }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
        >
          <SignIn 
            appearance={{
              baseTheme: dark,
              variables: {
                colorPrimary: '#8253FF',
                colorBackground: 'transparent',
                colorInputBackground: '#181818',
                colorInputText: '#FFFFFF',
                colorText: '#FFFFFF',
                colorTextSecondary: '#A1A1AA',
              },
              elements: {
                cardBox: "!shadow-none !border-none !bg-transparent",
                rootBox: "!w-full !flex !justify-center",
                card: "!bg-transparent !shadow-none !border-none !px-2 sm:!px-0",
                headerTitle: "!text-white !font-sans !font-medium !text-[20px] sm:!text-[28px] !tracking-tight !text-center !mb-4 sm:!mb-6",
                headerSubtitle: "!hidden", 
                formButtonPrimary: "!bg-gradient-to-r !from-[#8253FF] !to-[#A37BFF] hover:!opacity-90 !text-white !text-[12px] sm:!text-[14px] !font-bold !uppercase !tracking-[0.1em] !rounded-xl !py-3 sm:!py-4 !mt-2 transition-all !shadow-[0_0_30px_rgba(130,83,255,0.3)] !border-none !w-full",
                formFieldLabel: "!hidden", 
                formFieldInput: "!bg-white/5 !border !border-white/[0.1] !text-white !rounded-xl !px-4 sm:!px-5 !py-3 sm:!py-4 !mb-3 sm:!mb-4 focus:!ring-1 focus:!ring-[#8253FF] focus:!border-[#8253FF] placeholder:!text-stone-400 placeholder:!font-light transition-all !w-full !text-[14px] sm:!text-[15px]",
                footer: "!bg-transparent !p-0 !mt-5 sm:!mt-6",
                footerActionText: "!text-stone-400 !text-[12px] sm:!text-[14px]",
                footerActionLink: "!text-[#8253FF] hover:!text-[#A37BFF] !text-[12px] sm:!text-[14px] !font-medium",
                socialButtonsBlockButton: "!bg-white/5 !border !border-white/[0.1] hover:!bg-white/10 !text-white transition-all !rounded-xl !py-3 sm:!py-4 !w-full !mb-1.5 sm:!mb-2 !px-2",
                socialButtonsBlockButtonText: "!font-sans !font-medium !text-[13px] sm:!text-[15px] !text-white",
                dividerLine: "!bg-white/[0.1]",
                dividerText: "!text-stone-400 !font-sans !text-[13px] !px-4",
                formFieldAction: "!text-[#8253FF] hover:!text-[#A37BFF] !text-xs !font-medium !absolute !right-2 !top-0 !-mt-6",
                identityPreviewText: "!text-white",
                identityPreviewEditButton: "!text-[#8253FF]",
                formFieldInputShowPasswordButton: "!text-stone-400 hover:!text-white"
              }
            }}
          />
        </motion.div>

      </div>
    </div>
  );
}
