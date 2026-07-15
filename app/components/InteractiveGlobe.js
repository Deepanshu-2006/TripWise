'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const detectDestination = (prompt) => {
  if (!prompt || prompt === 'Global View' || prompt === 'Your Destination') return null;
  const lower = prompt.toLowerCase();
  if (lower.includes("kyoto")) return "Kyoto, Japan 🌸";
  if (lower.includes("rome")) return "Rome, Italy 🍕";
  if (lower.includes("tokyo")) return "Tokyo, Japan ⚡";
  if (lower.includes("london")) return "London, United Kingdom 👑";
  if (lower.includes("paris")) return "Paris, France 🍷";
  if (lower.includes("swiss") || lower.includes("alps")) return "Swiss Alps, Switzerland 🏔️";
  
  // Search for capitalised nouns or words after "in" or "to"
  const match = prompt.match(/(?:in|to|visit)\s+([A-Z][a-zA-Z\s,]+)(?:for|with|during|budget|\.|\b|$)/i);
  if (match && match[1]) {
    const cleanCity = match[1].split(/\s+(?:for|with|during|budget)\s+/i)[0].trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
    if (cleanCity.length > 2 && cleanCity.split(/\s+/).length <= 4) {
      return cleanCity;
    }
  }
  return null;
};

const normalizeAngleDiff = (diff) => {
  return Math.atan2(Math.sin(diff), Math.cos(diff));
};

const getCoordinatesForDestination = (name) => {
  if (!name) return { lat: 35.0116, lng: 135.7681 };
  const lower = name.toLowerCase();
  if (lower.includes("kyoto")) return { lat: 35.0116, lng: 135.7681 };
  if (lower.includes("rome")) return { lat: 41.9028, lng: 12.4964 };
  if (lower.includes("tokyo")) return { lat: 35.6762, lng: 139.6503 };
  if (lower.includes("swiss") || lower.includes("alps")) return { lat: 46.8182, lng: 8.2275 };
  if (lower.includes("london")) return { lat: 51.5074, lng: -0.1278 };
  if (lower.includes("paris")) return { lat: 48.8566, lng: 2.3522 };
  return { lat: 35.0116, lng: 135.7681 };
};

const getGlobeRotation = (lat, lng) => {
  return {
    x: (lat * 0.4) * (Math.PI / 180),
    y: (lng + 90) * (Math.PI / 180)
  };
};

const getDestinationMetadata = (name) => {
  if (!name) return {
    bestSeason: "Year-Round Escapes",
    airport: "Local Hub Airport",
    duration: "Flexible stay",
    timezone: "Local Timezone",
    coords: "Locked by GPS"
  };
  const lower = name.toLowerCase();
  
  if (lower.includes("kyoto")) {
    return {
      bestSeason: "Mar–May • Cherry Blossom",
      airport: "KIX (Kansai Intl)",
      duration: "4–6 Days",
      timezone: "GMT+9 (JST)",
      coords: "35.0116° N, 135.7681° E"
    };
  }
  if (lower.includes("rome")) {
    return {
      bestSeason: "Apr–Jun • Autumn Gold",
      airport: "FCO (Fiumicino)",
      duration: "3–5 Days",
      timezone: "GMT+2 (CEST)",
      coords: "41.9028° N, 12.4964° E"
    };
  }
  if (lower.includes("swiss") || lower.includes("alps")) {
    return {
      bestSeason: "Jun–Sep • Winter Ski",
      airport: "ZRH (Zurich Airport)",
      duration: "4–5 Days",
      timezone: "GMT+2 (CEST)",
      coords: "46.8182° N, 8.2275° E"
    };
  }
  if (lower.includes("tokyo")) {
    return {
      bestSeason: "Oct–Dec • Spring Bloom",
      airport: "HND (Haneda)",
      duration: "5–7 Days",
      timezone: "GMT+9 (JST)",
      coords: "35.6762° N, 139.6503° E"
    };
  }
  if (lower.includes("london")) {
    return {
      bestSeason: "May–Sep • Summer Festivals",
      airport: "LHR (Heathrow)",
      duration: "4–6 Days",
      timezone: "GMT+1 (BST)",
      coords: "51.5074° N, 0.1278° W"
    };
  }
  if (lower.includes("paris")) {
    return {
      bestSeason: "Apr–Jun • Autumn Gold",
      airport: "CDG (Charles de Gaulle)",
      duration: "3–5 Days",
      timezone: "GMT+2 (CEST)",
      coords: "48.8566° N, 2.3522° E"
    };
  }
  return {
    bestSeason: "Year-Round Escapes",
    airport: "Local Hub Airport",
    duration: "Flexible stay",
    timezone: "Local Timezone",
    coords: "Locked by GPS"
  };
};

export default function InteractiveGlobe({
  isGenerating = false,
  isTransitioning = false,
  activeStepText = '',
  destinationName = 'Your Destination',
  targetCoordinates = { lat: 35.0116, lng: 135.7681 },
  onSelectPrompt
}) {
  const containerRef = useRef(null);
  const globeGroupRef = useRef(null);
  const flightPathGroupRef = useRef(null);
  const planeGroupRef = useRef(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Track props in ref for smooth access inside animation loop without re-initializing WebGL
  const stateRef = useRef({ isGenerating, isTransitioning, activeStepText, destinationName, targetCoordinates });
  useEffect(() => {
    stateRef.current = { isGenerating, isTransitioning, activeStepText, destinationName, targetCoordinates };
  }, [isGenerating, isTransitioning, activeStepText, destinationName, targetCoordinates]);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 420;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 6.65;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // 2. Load Realistic Earth Textures
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';

    const earthRadius = 2.4;
    const sphereGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);

    // Realistic Blue Marble Earth Texture & Topology Bump Map
    const earthMap = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
    const bumpMap = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png');

    const earthMaterial = new THREE.MeshPhongMaterial({
      map: earthMap,
      bumpMap: bumpMap,
      bumpScale: 0.05,
      specular: new THREE.Color(0x222222),
      shininess: 25
    });

    const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // 3. Realistic Rotating Cloud Layer
    const cloudGeometry = new THREE.SphereGeometry(earthRadius + 0.025, 64, 64);
    const cloudMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png');
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudMap,
      transparent: true,
      opacity: 0.45
    });
    const cloudsMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    globeGroup.add(cloudsMesh);

    // 4. Outer Atmospheric Blue Halo Glow
    const haloGeometry = new THREE.SphereGeometry(earthRadius + 0.15, 64, 64);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide
    });
    const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
    globeGroup.add(haloMesh);

    // 5. Holographic Flight Path and Airplane
    const flightPathGroup = new THREE.Group();
    flightPathGroup.visible = false;
    flightPathGroupRef.current = flightPathGroup;
    globeGroup.add(flightPathGroup);

    // Create curved flight path points
    const numPathPoints = 90;
    const pathPoints = [];
    const orbitRadius = 2.65;
    const tiltAngle = Math.PI / 5; // 36 degrees tilt

    for (let i = 0; i <= numPathPoints; i++) {
      const theta = (i / numPathPoints) * Math.PI * 2;
      const x = Math.cos(theta) * orbitRadius;
      const y = Math.sin(theta) * orbitRadius;
      const z = 0;
      
      const rotatedY = y * Math.cos(tiltAngle);
      const rotatedZ = y * Math.sin(tiltAngle);
      
      pathPoints.push(new THREE.Vector3(x, rotatedY, rotatedZ));
    }

    // Render path as a dashed line
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    const pathMaterial = new THREE.LineDashedMaterial({
      color: 0xFF6B2C,
      dashSize: 0.12,
      gapSize: 0.08,
      transparent: true,
      opacity: 0.55
    });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    pathLine.computeLineDistances();
    flightPathGroup.add(pathLine);

    // Create Glowing Flight Pulse (Replacing Airplane)
    const planeGroup = new THREE.Group();
    planeGroup.visible = false;
    planeGroupRef.current = planeGroup;
    globeGroup.add(planeGroup);

    const pulseMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF6B2C,
      toneMapped: false
    });

    // Core pulse point
    const coreGeom = new THREE.SphereGeometry(0.025, 16, 16);
    const core = new THREE.Mesh(coreGeom, pulseMaterial);
    planeGroup.add(core);

    // Outer glow ring/halo
    const glowGeom = new THREE.SphereGeometry(0.06, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF6B2C,
      transparent: true,
      opacity: 0.35,
      toneMapped: false
    });
    const glow = new THREE.Mesh(glowGeom, glowMaterial);
    planeGroup.add(glow);

    // 6. Lighting for Realistic Sun & Space Ambiance
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const backLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    backLight.position.set(-5, -3, -5);
    scene.add(backLight);

    // 7. Mouse & Touch Drag Controls for Free 360° Rotation
    const handleMouseDown = (e) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = {
        x: e.clientX || (e.touches && e.touches[0].clientX) || 0,
        y: e.clientY || (e.touches && e.touches[0].clientY) || 0
      };
    };

    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      const deltaX = clientX - previousMousePositionRef.current.x;
      const deltaY = clientY - previousMousePositionRef.current.y;

      globeGroup.rotation.y += deltaX * 0.006;
      globeGroup.rotation.x += deltaY * 0.006;

      // Clamp vertical tilt gently so it feels natural
      globeGroup.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, globeGroup.rotation.x));

      previousMousePositionRef.current = { x: clientX, y: clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const domElement = renderer.domElement;
    domElement.style.cursor = 'grab';
    domElement.addEventListener('mousedown', handleMouseDown);
    domElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    domElement.addEventListener('touchstart', handleMouseDown, { passive: true });
    domElement.addEventListener('touchmove', handleMouseMove, { passive: true });
    window.addEventListener('touchend', handleMouseUp);

    // 8. Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const state = stateRef.current;

      if (state.isTransitioning) {
        // PHASE: CAMERA PLUNGE / TARGET LOCK ON GENERATED TRIP!
        // Smoothly rotate right to target coordinates (Lat/Lng to radians)
        if (state.targetCoordinates?.lat !== undefined && state.targetCoordinates?.lng !== undefined) {
          const rot = getGlobeRotation(state.targetCoordinates.lat, state.targetCoordinates.lng);
          const diffY = normalizeAngleDiff(rot.y - globeGroup.rotation.y);
          const diffX = normalizeAngleDiff(rot.x - globeGroup.rotation.x);
          globeGroup.rotation.y += diffY * 0.035; // Slower, smooth target ease-in!
          globeGroup.rotation.x += diffX * 0.035;
        }

        // Zoom camera smoothly and rapidly toward target country on Earth's surface!
        camera.position.z += (3.3 - camera.position.z) * 0.08;

        if (flightPathGroupRef.current && planeGroupRef.current) {
          flightPathGroupRef.current.visible = true;
          planeGroupRef.current.visible = true;
          
          // Animate plane position along path
          const speed = 0.0024;
          const planeProgress = (Date.now() * speed) % (Math.PI * 2);
          const orbitRadius = 2.65;
          const tiltAngle = Math.PI / 5;
          
          const px = Math.cos(planeProgress) * orbitRadius;
          const py = Math.sin(planeProgress) * orbitRadius;
          const rotatedY = py * Math.cos(tiltAngle);
          const rotatedZ = py * Math.sin(tiltAngle);
          
          planeGroupRef.current.position.set(px, rotatedY, rotatedZ);
          
          // Look at next coordinate forward
          const nextProgress = planeProgress + 0.02;
          const npx = Math.cos(nextProgress) * orbitRadius;
          const npy = Math.sin(nextProgress) * orbitRadius;
          const nrotatedY = npy * Math.cos(tiltAngle);
          const nrotatedZ = npy * Math.sin(tiltAngle);
          
          planeGroupRef.current.lookAt(new THREE.Vector3(npx, nrotatedY, nrotatedZ));
          
          // Recolor plane/path to target lock emerald green
          planeGroupRef.current.children.forEach(c => {
            if (c.material) c.material.color.setHex(0x10b981);
          });
          if (flightPathGroupRef.current.children[0]?.material) {
            flightPathGroupRef.current.children[0].material.color.setHex(0x10b981);
          }
        }
      } else if (state.isGenerating) {
        // PHASE: HYPER-SPEED SATELLITE SCANNING (While trip is generating) - SLOWED DOWN FOR PREMIUM FEEL
        globeGroup.rotation.y += 0.005;
        globeGroup.rotation.x = Math.sin(Date.now() * 0.0004) * 0.12;

        // Clouds counter-rotate for dramatic atmospheric turbulence
        cloudsMesh.rotation.y -= 0.0008;

        if (flightPathGroupRef.current && planeGroupRef.current) {
          flightPathGroupRef.current.visible = true;
          planeGroupRef.current.visible = true;
          
          // Animate plane position along path
          const speed = 0.0038; // faster scan
          const planeProgress = (Date.now() * speed) % (Math.PI * 2);
          const orbitRadius = 2.65;
          const tiltAngle = Math.PI / 5;
          
          const px = Math.cos(planeProgress) * orbitRadius;
          const py = Math.sin(planeProgress) * orbitRadius;
          const rotatedY = py * Math.cos(tiltAngle);
          const rotatedZ = py * Math.sin(tiltAngle);
          
          planeGroupRef.current.position.set(px, rotatedY, rotatedZ);
          
          // Look at next coordinate forward
          const nextProgress = planeProgress + 0.02;
          const npx = Math.cos(nextProgress) * orbitRadius;
          const npy = Math.sin(nextProgress) * orbitRadius;
          const nrotatedY = npy * Math.cos(tiltAngle);
          const nrotatedZ = npy * Math.sin(tiltAngle);
          
          planeGroupRef.current.lookAt(new THREE.Vector3(npx, nrotatedY, nrotatedZ));
          
          // Recolor plane/path back to primary orange
          planeGroupRef.current.children.forEach(c => {
            if (c.material) c.material.color.setHex(0xFF6B2C);
          });
          if (flightPathGroupRef.current.children[0]?.material) {
            flightPathGroupRef.current.children[0].material.color.setHex(0xFF6B2C);
          }
        }

        // Smoothly reset camera distance if previously zoomed
        camera.position.z += (6.65 - camera.position.z) * 0.05;
      } else {
        // PHASE: IDLE REALISTIC GLOBE
        const detected = detectDestination(state.destinationName);
        if (detected && !isDraggingRef.current) {
          const coords = getCoordinatesForDestination(detected);
          const rot = getGlobeRotation(coords.lat, coords.lng);
          const diffY = normalizeAngleDiff(rot.y - globeGroup.rotation.y);
          const diffX = normalizeAngleDiff(rot.x - globeGroup.rotation.x);
          globeGroup.rotation.y += diffY * 0.02; // Slower cinematic lock
          globeGroup.rotation.x += diffX * 0.02;
        } else {
          if (!isDraggingRef.current) {
            globeGroup.rotation.y += 0.0012; // Slower idle speed
          }
        }
        cloudsMesh.rotation.y += 0.0003;

        if (flightPathGroupRef.current && planeGroupRef.current) {
          flightPathGroupRef.current.visible = false;
          planeGroupRef.current.visible = false;
        }

        // Smoothly return camera to space distance
        camera.position.z += (6.65 - camera.position.z) * 0.05;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
      domElement.removeEventListener('mousedown', handleMouseDown);
      domElement.removeEventListener('mousemove', handleMouseMove);
      domElement.removeEventListener('touchstart', handleMouseDown);
      domElement.removeEventListener('touchmove', handleMouseMove);
      if (renderer.domElement && containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center justify-center animate-fade-in my-auto py-2">
      {/* Dynamic Header State */}
      {isTransitioning ? (
        <div className="text-center max-w-md mx-auto mb-1 animate-fade-in">
          <span className="text-xs font-black uppercase tracking-widest text-white bg-[#10b981] px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/30 inline-flex items-center gap-2 animate-bounce mb-2">
            ✨ TARGET LOCKED: {destinationName?.toUpperCase()}
          </span>
          <h3 className="text-xl md:text-2xl font-black text-stone-900 tracking-tight">
            Plunging Into Local Terrain...
          </h3>
          <p className="text-xs md:text-sm text-[#10b981] mt-1 font-bold">
            Directing satellite coordinates to your custom interactive route map.
          </p>
        </div>
      ) : isGenerating ? (
        <div className="text-center max-w-md mx-auto mb-1 animate-fade-in">
          <span className="text-xs font-black uppercase tracking-widest text-white bg-[#FF6B35] px-4 py-1.5 rounded-full shadow-lg shadow-orange-500/30 inline-flex items-center gap-2 animate-pulse mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            📡 SATELLITE SCAN: {destinationName?.toUpperCase() || 'GLOBAL SECTOR'}
          </span>
          <h3 className="text-xl md:text-2xl font-black text-stone-900 tracking-tight">
            Triangulating AI Waypoints...
          </h3>
          <p className="text-xs md:text-sm font-extrabold text-[#FF6B35] mt-1.5 bg-white/95 px-4 py-2 rounded-xl border border-[#FF6B35]/20 shadow-sm max-w-xs mx-auto animate-pulse">
            {activeStepText || 'Triangulating optimal GPS coordinates & scenic routes...'}
          </p>
        </div>
      ) : (() => {
        const detected = detectDestination(destinationName);
        const hasInput = destinationName && destinationName !== 'Global View' && destinationName !== 'Your Destination';
        return (
          <div className="text-center max-w-md mx-auto mb-2 animate-fade-in px-4">
            {detected ? (
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#2FA66A] bg-[#2FA66A]/10 px-3.5 py-1.5 rounded-full border border-[#2FA66A]/30 shadow-2xs inline-flex items-center gap-1.5 mb-2 animate-[pulse_2.5s_infinite_ease-in-out]">
                <span>📍</span>
                <span>Location Detected: {detected}</span>
              </span>
            ) : hasInput ? (
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF6B2C] bg-[#FF6B2C]/10 px-3.5 py-1.5 rounded-full border border-[#FF6B2C]/30 shadow-2xs inline-flex items-center gap-1.5 mb-2">
                <span>✍️</span>
                <span>Typing Draft Prompt</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#6B6B6B] bg-[#F7F5F2] px-3.5 py-1.5 rounded-full border border-[#ECE8E2] shadow-sm inline-flex items-center gap-1.5 mb-2">
                <span>🌍</span>
                <span>Interactive 3D Globe</span>
              </span>
            )}
            <h3 className="text-lg md:text-xl font-bold text-[#1F1F1F] tracking-tight truncate max-w-sm" title={destinationName}>
              {detected
                ? `Ready to Map: ${detected.split(',')[0]} Route`
                : hasInput
                ? `Live Route Target Preview`
                : "Explore Global Destinations"}
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
              {detected
                ? "TripWise is ready to map this route. Adjust details on the left and click 'Plan My Trip' to begin!"
                : hasInput
                ? `Keep describing your trip. TripWise will lock coordinates as soon as you click "Plan My Trip".`
                : "Enter your trip details on the left to generate an AI route & itinerary."}
            </p>
          </div>
        );
      })()}

      {/* 3D Canvas Container - made more compact to prevent visual dead space */}
      <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-88 flex items-center justify-center my-1">
        <div ref={containerRef} className="w-full h-full max-w-3xl flex items-center justify-center cursor-grab active:cursor-grabbing" />
      </div>

      {/* Supporting Content: Recent Curated Dossiers Dock vs Live Telemetry Console */}
      {!isGenerating && !isTransitioning && (() => {
        const hasInput = destinationName && destinationName !== 'Global View' && destinationName !== 'Your Destination';
        
        if (!hasInput) {
          return (
            <div className="w-full max-w-3xl mt-4 px-4 select-none animate-fade-in">
              <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <span>✦</span> Pre-Built Signature Itineraries (Full Previews)
                </span>
                <span className="text-[10px] text-stone-400 font-semibold">Click to Load & Preview</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    dest: "Kyoto, Japan",
                    desc: "5 Days • Springs & Temples",
                    prompt: "🌸 5 days in Kyoto: temples, gardens & street food",
                    rating: "4.9",
                    tag: "Cultural"
                  },
                  {
                    dest: "Rome, Italy",
                    desc: "3 Days • Historic Escapes",
                    prompt: "🍕 3 budget days in Rome: hidden gems & local pasta",
                    rating: "4.8",
                    tag: "Historic"
                  },
                  {
                    dest: "Swiss Alps",
                    desc: "4 Days • Mountain Scenic",
                    prompt: "🏔️ 4 days in Swiss Alps: scenic hiking & boutique chalets",
                    rating: "4.9",
                    tag: "Nature"
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (onSelectPrompt) onSelectPrompt(item.prompt);
                    }}
                    className="bg-stone-50/50 hover:bg-[#FF6B2C]/5 hover:border-[#FF6B2C]/30 border border-stone-200/60 rounded-xl p-3 transition-all duration-200 cursor-pointer flex flex-col justify-between text-left group shadow-3xs hover:-translate-y-0.5 active:scale-98"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-stone-200/60 text-stone-600 tracking-tight group-hover:bg-[#FF6B2C]/10 group-hover:text-[#FF6B2C]">
                          {item.tag}
                        </span>
                        <span className="text-[10px] font-bold text-amber-600">★ {item.rating}</span>
                      </div>
                      <h4 className="text-xs font-bold text-stone-850 group-hover:text-[#FF6B2C] transition-colors truncate">
                        {item.dest}
                      </h4>
                      <p className="text-[10px] text-stone-500 mt-0.5 truncate">{item.desc}</p>
                    </div>
                    <div className="mt-3 text-[9px] font-extrabold text-[#FF6B2C] flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <span>Use Template</span> <span>→</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        } else {
          const meta = getDestinationMetadata(destinationName);
          
          return (
            <div className="w-full max-w-3xl mt-4 px-4 select-none animate-fade-in">
              <div className="flex items-center justify-between mb-3 border-b border-stone-200/60 pb-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#FF6B2C] flex items-center gap-1.5">
                  <span>📍</span> Destination Profile & Travel Info
                </span>
                <span className="text-[10px] text-stone-400 font-bold tracking-wider uppercase">Verified Insights</span>
              </div>
              <div className="bg-white/80 border border-stone-200/60 rounded-2xl p-4 shadow-xs backdrop-blur-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                <div>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Target Coordinates</span>
                  <span className="text-xs font-extrabold text-stone-800 block mt-0.5 font-mono">
                    {meta.coords}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Best Travel Window</span>
                  <span className="text-xs font-extrabold text-stone-800 block mt-0.5">
                    {meta.bestSeason}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Primary Air Hub</span>
                  <span className="text-xs font-extrabold text-stone-800 block mt-0.5">
                    {meta.airport}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block">Ideal Duration</span>
                  <span className="text-xs font-extrabold text-stone-800 block mt-0.5">
                    {meta.duration}
                  </span>
                </div>
              </div>
            </div>
          );
        }
      })()}
    </div>
  );
}
