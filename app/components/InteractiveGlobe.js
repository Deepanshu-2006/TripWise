'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function InteractiveGlobe({
  isGenerating = false,
  isTransitioning = false,
  activeStepText = '',
  destinationName = 'Your Destination',
  targetCoordinates = { lat: 35.0116, lng: 135.7681 }
}) {
  const containerRef = useRef(null);
  const globeGroupRef = useRef(null);
  const ringRef = useRef(null);
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

    // 5. Holographic Orbital Laser Scanning Ring (Only active during AI Triangulation / Target Lock)
    const ringGeometry = new THREE.TorusGeometry(2.9, 0.018, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF6B35,
      transparent: true,
      opacity: 0.7
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.visible = false;
    ringRef.current = ringMesh;
    globeGroup.add(ringMesh);

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
          const targetLonRad = (state.targetCoordinates.lng + 90) * (Math.PI / 180);
          const targetLatRad = (state.targetCoordinates.lat * 0.4) * (Math.PI / 180);
          globeGroup.rotation.y += (targetLonRad - globeGroup.rotation.y) * 0.1;
          globeGroup.rotation.x += (targetLatRad - globeGroup.rotation.x) * 0.1;
        }

        // Zoom camera smoothly and rapidly toward target country on Earth's surface!
        camera.position.z += (3.3 - camera.position.z) * 0.08;

        if (ringRef.current) {
          ringRef.current.visible = true;
          ringRef.current.material.color.setHex(0x10b981); // Emerald green target lock
          ringRef.current.rotation.z += 0.12;
          ringRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.01) * 0.05);
        }
      } else if (state.isGenerating) {
        // PHASE: HYPER-SPEED SATELLITE SCANNING (While trip is generating)
        globeGroup.rotation.y += 0.038;
        globeGroup.rotation.x = Math.sin(Date.now() * 0.002) * 0.25;

        // Clouds counter-rotate for dramatic atmospheric turbulence
        cloudsMesh.rotation.y -= 0.015;

        if (ringRef.current) {
          ringRef.current.visible = true;
          ringRef.current.material.color.setHex(0xFF6B35); // Orange high-energy radar scan
          ringRef.current.rotation.z += 0.04;
          ringRef.current.rotation.x = Math.sin(Date.now() * 0.003) * 0.6;
          ringRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.008) * 0.08);
        }

        // Smoothly reset camera distance if previously zoomed
        camera.position.z += (6.65 - camera.position.z) * 0.05;
      } else {
        // PHASE: IDLE REALISTIC GLOBE
        if (!isDraggingRef.current) {
          globeGroup.rotation.y += 0.0025;
        }
        cloudsMesh.rotation.y += 0.0008;

        if (ringRef.current) {
          ringRef.current.visible = false;
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
      ) : null}

      {/* 3D Canvas Container */}
      <div className="relative w-full h-80 sm:h-[420px] md:h-[460px] flex items-center justify-center my-1">
        <div ref={containerRef} className="w-full h-full max-w-3xl flex items-center justify-center cursor-grab active:cursor-grabbing" />
      </div>
    </div>
  );
}
