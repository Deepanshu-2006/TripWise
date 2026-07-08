'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function InteractiveGlobe() {
  const containerRef = useRef(null);
  const globeGroupRef = useRef(null);
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 420;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 7.2;

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

    // 5. Lighting for Realistic Sun & Space Ambiance
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const backLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    backLight.position.set(-5, -3, -5);
    scene.add(backLight);

    // 6. Mouse & Touch Drag Controls for Free 360° Rotation
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

    // 7. Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isDraggingRef.current) {
        // Smooth idle rotation
        globeGroup.rotation.y += 0.0025;
      }

      // Clouds rotate slightly faster/independently from the Earth surface
      cloudsMesh.rotation.y += 0.0008;

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Handling
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
      {/* Globe Title Header */}
      <div className="text-center max-w-md mx-auto mb-1">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF6B35] bg-[#FF6B35]/10 px-3 py-1 rounded-full border border-[#FF6B35]/20 inline-block mb-2">
          🌍 3D Global Route Radar
        </span>
        <h3 className="text-xl md:text-2xl font-black text-stone-900 tracking-tight">
          Interactive Realistic Globe
        </h3>
        <p className="text-xs md:text-sm text-stone-600 mt-1 font-medium">
          Drag to freely spin the realistic 3D Earth, or enter your dream destination on the left to start planning.
        </p>
      </div>

      {/* 3D Canvas Container */}
      <div className="relative w-full h-80 sm:h-96 md:h-[430px] flex items-center justify-center my-2">
        <div ref={containerRef} className="w-full h-full max-w-2xl flex items-center justify-center cursor-grab active:cursor-grabbing" />
      </div>
    </div>
  );
}
