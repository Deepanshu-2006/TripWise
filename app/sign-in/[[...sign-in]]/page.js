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
  const [isLightOn, setIsLightOn] = useState(false);
  
  // Motion Values
  const dragY = useMotionValue(0);
  const stringRotate = useMotionValue(0);
  
  // Derived Transforms
  const dragOpacity = useTransform(dragY, [0, 100], [0, 1]);
  const textOpacity = useTransform(dragY, [0, 40], [1, 0]);
  const formY = useTransform(dragY, [0, 100], [20, 0]);

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#030303] relative overflow-hidden transition-colors duration-1000">
      
      {/* Ambient Room Lighting Layer (Warm glow spreading across the room) */}
      <motion.div 
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(255,210,120,0.08),transparent_70%)] pointer-events-none"
        style={{ opacity: isLightOn ? 1 : dragOpacity }}
        animate={isLightOn ? { opacity: [0, 0.8, 0.3, 1] } : undefined}
        transition={{ duration: 0.5, times: [0, 0.1, 0.3, 1] }} 
      />
      
      {/* Top Instruction Text */}
      {!isLightOn && (
        <motion.div 
          className="absolute top-24 text-stone-600 font-sans text-[11px] font-bold tracking-[0.3em] uppercase pointer-events-none"
          style={{ opacity: textOpacity }}
        >
          Pull the string to toggle login
        </motion.div>
      )}

      {/* Main Content Layout */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-between px-10 gap-20">
        
        {/* Left Side: Floor Lamp */}
        <div className="relative w-full max-w-[400px] h-[600px] flex flex-col items-center justify-end">
          
          {/* The Light Beam Container */}
          <motion.div 
            className="absolute top-[28px] w-[800px] h-[650px] pointer-events-none origin-top mix-blend-screen"
            style={{ 
              opacity: isLightOn ? 1 : dragOpacity
            }}
            animate={isLightOn ? { opacity: [0, 1, 0.4, 1] } : undefined}
            transition={{ opacity: { duration: 0.4, times: [0, 0.1, 0.2, 1] } }}
          >
            {/* Core intense beam */}
            <div 
              className="absolute inset-0 bg-gradient-to-b from-[#FFF2B2]/60 to-transparent blur-[4px] z-10"
              style={{ clipPath: 'polygon(46% 0, 54% 0, 80% 100%, 20% 100%)' }} 
            />
            {/* Soft, wide volumetric scatter */}
            <div 
              className="absolute inset-0 bg-gradient-to-b from-[#FFD875]/20 to-transparent blur-3xl z-0"
              style={{ clipPath: 'polygon(40% 0, 60% 0, 100% 100%, 0% 100%)' }} 
            />
            
            {/* Volumetric Dust Particles */}
            <DustParticles isVisible={isLightOn} />
          </motion.div>
          
          {/* Lamp Hardware (Premium Metallic Silhouette) */}
          <div className="relative flex flex-col items-center w-full h-full z-20">
            
            {/* Lamp Head (Ultra-thin disc with metallic rim and highlight) */}
            <div className="w-72 h-3.5 bg-gradient-to-b from-[#222222] to-[#050505] rounded-[100%] absolute top-[15px] z-30 shadow-[0_10px_30px_rgba(0,0,0,0.9)] border-t border-white/[0.08]" />
            
            {/* Inner Bulb Housing (Physical structure under the head) */}
            <div className="w-32 h-2.5 bg-gradient-to-b from-[#111111] to-[#0A0A0A] rounded-b-[100%] absolute top-[18px] z-20" />
            
            {/* Glowing Bulb (Radiates light) */}
            <motion.div 
              className="w-32 h-5 bg-[#FFF5C2] rounded-full absolute top-[18px] blur-[10px] z-20"
              style={{ opacity: isLightOn ? 1 : dragOpacity }}
              animate={isLightOn ? { opacity: [0, 1, 0.5, 1] } : undefined}
              transition={{ duration: 0.4 }}
            />
            
            {/* Lamp Pole (Tubular metallic gradient) */}
            <div className="w-2 h-[560px] bg-gradient-to-r from-[#050505] via-[#2A2A2A] to-[#050505] absolute top-[20px] z-30 border-l border-white/[0.03]" />
            
            {/* Lamp Base (Heavy multi-layered beveled base) */}
            <div className="absolute bottom-0 z-30 flex flex-col items-center">
              {/* Sloped upper base */}
              <div className="w-32 h-3 bg-gradient-to-b from-[#222222] to-[#111111] rounded-t-[100%] border-t border-white/[0.05]" />
              {/* Heavy block base */}
              <div className="w-48 h-4 bg-[#0A0A0A] rounded-t-sm shadow-[0_10px_30px_rgba(0,0,0,1)] border-t border-white/[0.08]" />
            </div>

            {/* The Pull String (with Pendulum Physics) */}
            <motion.div
              style={{ 
                originY: 0, 
                rotate: stringRotate, 
                x: 110 // Shifted slightly further out for the wider 72px head
              }}
              className={`absolute top-[22px] z-40 flex flex-col items-center ${isLightOn ? 'cursor-default pointer-events-none' : 'cursor-grab active:cursor-grabbing'}`}
            >
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 80 }}
                dragElastic={0.1}
                style={{ y: dragY }}
                onDragEnd={handleDragEnd}
                className="w-[2px] h-40 bg-gradient-to-r from-[#111] via-[#444] to-[#111] shadow-xl flex flex-col items-center justify-end"
              >
                {/* Handle (Metallic brass finish) */}
                <div className="w-4 h-7 bg-gradient-to-br from-[#FFD275] via-[#C9902E] to-[#664610] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] absolute -bottom-3 border border-[#FFD275]/40" />
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Ultra-Premium Login Form */}
        <motion.div 
          className="relative z-30 w-[420px] shrink-0 p-10 rounded-[2rem] bg-[#111111]/80 border border-white/[0.04] backdrop-blur-2xl"
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
                card: "!bg-transparent !shadow-none !border-none",
                headerTitle: "!text-white !font-sans !font-medium !text-[28px] !tracking-tight !text-center !mb-6",
                headerSubtitle: "!hidden", 
                formButtonPrimary: "!bg-gradient-to-r !from-[#8253FF] !to-[#A37BFF] hover:!opacity-90 !text-white !text-[14px] !font-bold !uppercase !tracking-[0.1em] !rounded-xl !py-4 !mt-2 transition-all !shadow-[0_0_30px_rgba(130,83,255,0.3)] !border-none !w-full",
                formFieldLabel: "!hidden", 
                formFieldInput: "!bg-white/5 !border !border-white/[0.1] !text-white !rounded-xl !px-5 !py-4 !mb-4 focus:!ring-1 focus:!ring-[#8253FF] focus:!border-[#8253FF] placeholder:!text-stone-400 placeholder:!font-light transition-all !w-full !text-[15px]",
                footer: "!bg-transparent",
                footerActionText: "!text-stone-400 !text-[14px]",
                footerActionLink: "!text-[#8253FF] hover:!text-[#A37BFF] !text-[14px] !font-medium",
                socialButtonsBlockButton: "!bg-white/5 !border !border-white/[0.1] hover:!bg-white/10 !text-white transition-all !rounded-xl !py-4 !w-full !mb-2",
                socialButtonsBlockButtonText: "!font-sans !font-medium !text-[15px] !text-white",
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
