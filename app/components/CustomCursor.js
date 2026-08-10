'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // Interactive States
  const [isClicking, setIsClicking] = useState(false);
  const [isHoveringLink, setIsHoveringLink] = useState(false);
  const [isHoveringText, setIsHoveringText] = useState(false);

  // Exact mouse position for the plane
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  
  // Velocity banking (tilting the plane when swiping left/right)
  const planeBank = useSpring(0, { stiffness: 400, damping: 28 });
  const planeRotation = useTransform(planeBank, (bank) => `rotate(${bank - 45}deg)`);
  const lastMouseX = useRef(-100);

  // Smoothed position for the tail to create a fluid flight path
  const springConfig = { stiffness: 600, damping: 35, mass: 0.15 };
  const tailX = useSpring(mouseX, springConfig);
  const tailY = useSpring(mouseY, springConfig);

  const numPoints = 16;
  const pathRef = useRef(null);
  const points = useRef(Array.from({ length: numPoints }, () => ({ x: -100, y: -100 })));
  const isRafRunning = useRef(false);

  useEffect(() => {
    // Disable on touch devices
    if (typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches) {
      setIsTouchDevice(true);
      return;
    }

    // Hide default cursor gracefully (keeping native text cursor for inputs so typing isn't annoying)
    const style = document.createElement('style');
    style.innerHTML = `
      body, a, button, div, span, p, h1, h2, h3, h4, h5, h6, svg, img { 
        cursor: none !important; 
      }
      input, textarea, [contenteditable="true"] { 
        cursor: text !important; 
      }
    `;
    document.head.appendChild(style);

    let animationFrameId;
    function render() {
      // The head of the tail follows the smoothed position, offset to emerge from the back of the plane
      points.current[0] = {
        x: tailX.get() + 10,
        y: tailY.get() + 10
      };

      let isMoving = false;
      for (let i = 1; i < points.current.length; i++) {
        const dx = points.current[i - 1].x - points.current[i].x;
        const dy = points.current[i - 1].y - points.current[i].y;

        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          isMoving = true;
        }

        // Lower multiplier = slower catch up (more delay)
        points.current[i] = {
          x: points.current[i].x + dx * 0.25,
          y: points.current[i].y + dy * 0.25
        };
      }

      if (isMoving && pathRef.current) {
        // Update DOM directly for maximum performance
        const circles = pathRef.current.children;
        for (let i = 0; i < points.current.length; i++) {
          if (circles[i]) {
            circles[i].setAttribute('cx', points.current[i].x);
            circles[i].setAttribute('cy', points.current[i].y);
          }
        }
        animationFrameId = requestAnimationFrame(render);
      } else {
        isRafRunning.current = false;
      }
    }

    const moveMouse = (e) => {
      // Calculate velocity for banking effect
      const currentX = e.clientX;
      const velocityX = currentX - lastMouseX.current;
      lastMouseX.current = currentX;
      
      // Target bank angle based on velocity (max 25 degrees tilt)
      const targetBank = Math.min(Math.max(velocityX * 0.8, -25), 25);
      planeBank.set(targetBank);

      mouseX.set(currentX);
      mouseY.set(e.clientY);
      
      setIsVisible((prev) => prev ? true : true); // Efficiently ensure it's visible without needing isVisible in deps

      if (!isRafRunning.current) {
        isRafRunning.current = true;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      // Check if hovering over a clickable element
      const isClickable = target.closest('a, button, [role="button"]') || window.getComputedStyle(target).cursor === 'pointer';
      // Check if hovering over text inputs (where native cursor is better)
      const isText = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable || window.getComputedStyle(target).cursor === 'text';
      
      setIsHoveringLink(!!isClickable);
      setIsHoveringText(!!isText);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', moveMouse, { capture: true });
    window.addEventListener('mouseover', handleMouseOver, { capture: true });
    window.addEventListener('mousedown', handleMouseDown, { capture: true });
    window.addEventListener('mouseup', handleMouseUp, { capture: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    document.documentElement.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      document.head.removeChild(style);
      window.removeEventListener('mousemove', moveMouse, { capture: true });
      window.removeEventListener('mouseover', handleMouseOver, { capture: true });
      window.removeEventListener('mousedown', handleMouseDown, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      document.documentElement.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
      isRafRunning.current = false;
    };
  }, [tailX, tailY, isVisible, mouseX, mouseY, planeBank]);

  if (isTouchDevice) return null;

  // Derived styling based on interactive states
  const cursorScale = isHoveringText ? 0 : (isClicking ? 0.8 : (isHoveringLink ? 1.25 : 1));
  const activeColor = '#FF6B2C'; // Always stays TripWise Orange

  return (
    <>
      {isVisible && (
        <>
          {/* Dotted Flight Path Tail */}
          <motion.svg
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-[9999998]"
            animate={{ opacity: isHoveringText ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <g ref={pathRef}>
              {Array.from({ length: numPoints }).map((_, i) => (
                <motion.circle
                  key={i}
                  cx="-100"
                  cy="-100"
                  r={Math.max(0.5, 3.5 - i * 0.25)}
                  animate={{ fill: activeColor }}
                  transition={{ duration: 0.3 }}
                  opacity={Math.max(0, 1 - i * 0.08)}
                />
              ))}
            </g>
          </motion.svg>
          
          {/* Premium Plane Cursor */}
          <motion.div
            className="fixed top-0 left-0 pointer-events-none z-[9999999]"
            style={{
              x: mouseX,
              y: mouseY,
            }}
          >
            <motion.div 
              animate={{ scale: cursorScale }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute"
              style={{ top: '-4px', left: '-6px' }}
            >
              <motion.svg 
                viewBox="-22 -4 60 84" 
                className="w-7 h-7 drop-shadow-xl"
                style={{ 
                  transform: planeRotation, 
                  filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.15))' 
                }}
              >
                <motion.path
                  d="M0 34 L8 0 L16 34 L34 44 L34 52 L16 46 L13 64 L21 70 L21 76 L8 70 L-5 76 L-5 70 L3 64 L0 46 L-18 52 L-18 44 Z"
                  animate={{ fill: activeColor }}
                  transition={{ duration: 0.3 }}
                  stroke="white"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </motion.div>
          </motion.div>
        </>
      )}
    </>
  );
}
