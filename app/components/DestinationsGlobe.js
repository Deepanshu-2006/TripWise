'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const DESTINATION_COORDS = {
  'kyoto': { lat: 35.0116, lng: 135.7681 },
  'new-york': { lat: 40.7128, lng: -74.0060 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'queenstown': { lat: -45.0312, lng: 168.6626 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'bali': { lat: -8.4095, lng: 115.1889 },
  'amalfi': { lat: 40.6340, lng: 14.6027 },
  'machu-picchu': { lat: -13.1631, lng: -72.5450 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'rio': { lat: -22.9068, lng: -43.1729 },
  'cape-town': { lat: -33.9249, lng: 18.4241 },
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'istanbul': { lat: 41.0082, lng: 28.9784 },
};

function getGlobeCoords(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  return {
    x: -(radius * Math.sin(phi) * Math.cos(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta)
  };
}

export default function DestinationsGlobe({ 
  destinations = [], 
  filteredDestIds = [], 
  onPinClick 
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const globeGroupRef = useRef(null);
  const pinsGroupRef = useRef(null);
  const requestRef = useRef(null);
  
  const [hoveredDest, setHoveredDest] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  // Track state in refs for animation loop
  const stateRef = useRef({ filteredDestIds, isInteracting: false });
  useEffect(() => {
    stateRef.current.filteredDestIds = filteredDestIds;
  }, [filteredDestIds]);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 6.65;
    // Lower camera slightly to view northern hemisphere well
    camera.position.y = 1.5;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // Initial globe rotation (face Europe/Asia)
    globeGroup.rotation.y = -Math.PI / 2;

    // 2. Load Textures
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';

    const earthRadius = 2.4;
    const sphereGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);

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

    // 3. Clouds
    const cloudGeometry = new THREE.SphereGeometry(earthRadius + 0.025, 64, 64);
    const cloudMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png');
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudMap,
      transparent: true,
      opacity: 0.45
    });
    const cloudsMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    globeGroup.add(cloudsMesh);

    // 4. Halo
    const haloGeometry = new THREE.SphereGeometry(earthRadius + 0.15, 64, 64);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide
    });
    const haloMesh = new THREE.Mesh(haloGeometry, haloMaterial);
    globeGroup.add(haloMesh);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);
    
    // 6. Pins
    const pinsGroup = new THREE.Group();
    pinsGroupRef.current = pinsGroup;
    globeGroup.add(pinsGroup);
    
    const pinGeometry = new THREE.SphereGeometry(0.04, 16, 16);
    
    destinations.forEach(dest => {
      const coords = DESTINATION_COORDS[dest.id];
      if (!coords) return;
      
      const { x, y, z } = getGlobeCoords(coords.lat, coords.lng, earthRadius + 0.03);
      
      // Material with glowing color
      const material = new THREE.MeshBasicMaterial({ 
        color: dest.badgeColor || 0xFF6B2C,
        transparent: true,
        opacity: 1.0
      });
      
      const pinMesh = new THREE.Mesh(pinGeometry, material);
      pinMesh.position.set(x, y, z);
      pinMesh.userData = { id: dest.id, dest };
      
      pinsGroup.add(pinMesh);
      
      // Outer glow/pulse ring
      const ringGeometry = new THREE.RingGeometry(0.05, 0.08, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: dest.badgeColor || 0xFF6B2C,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.position.set(x, y, z);
      ringMesh.lookAt(new THREE.Vector3(x*2, y*2, z*2)); // face outward
      ringMesh.userData = { isRing: true, baseOpacity: 0.5, id: dest.id };
      pinsGroup.add(ringMesh);
    });

    // 7. Raycaster for Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      setTooltipPos({ 
        x: event.clientX - rect.left, 
        y: event.clientY - rect.top 
      });
    };

    const onClick = () => {
      if (hoveredDestRef.current && onPinClick) {
        onPinClick(hoveredDestRef.current.id);
      }
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.addEventListener('mouseenter', () => stateRef.current.isInteracting = true);
    renderer.domElement.addEventListener('mouseleave', () => {
      stateRef.current.isInteracting = false;
      setHoveredDest(null);
      hoveredDestRef.current = null;
    });

    // Drag to rotate logic (simple manual rotation)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e) => {
      isDragging = true;
      stateRef.current.isInteracting = true;
      document.body.style.cursor = 'grabbing';
      previousMousePosition = { x: e.offsetX, y: e.offsetY };
    };

    const onMouseUp = () => {
      isDragging = false;
      stateRef.current.isInteracting = false;
      document.body.style.cursor = hoveredDestRef.current ? 'pointer' : 'default';
    };

    const onDragMove = (e) => {
      if (!isDragging) return;
      const deltaMove = {
        x: e.offsetX - previousMousePosition.x,
        y: e.offsetY - previousMousePosition.y
      };
      
      globeGroup.rotation.y += deltaMove.x * 0.005;
      globeGroup.rotation.x += deltaMove.y * 0.005;
      
      // limit x rotation so we don't turn globe upside down
      globeGroup.rotation.x = Math.max(-Math.PI/4, Math.min(Math.PI/4, globeGroup.rotation.x));
      
      previousMousePosition = { x: e.offsetX, y: e.offsetY };
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mouseleave', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onDragMove);

    // 8. Animation Loop
    let time = 0;
    const hoveredDestRef = { current: null };

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      
      // Smooth auto-rotation
      if (!stateRef.current.isInteracting && !isDragging) {
        globeGroup.rotation.y += 0.001; // very slow, smooth
        cloudsMesh.rotation.y += 0.0012; // clouds move slightly faster
      } else {
        cloudsMesh.rotation.y += 0.0002;
      }
      
      time += 0.05;
      
      // Update pins (filter fading & pulsing)
      const currentFiltered = stateRef.current.filteredDestIds;
      pinsGroup.children.forEach(child => {
        const destId = child.userData.id;
        const isVisible = currentFiltered.includes(destId);
        
        // Smooth opacity transition
        const targetOpacity = isVisible ? (child.userData.isRing ? 0.6 : 1.0) : 0.15;
        child.material.opacity += (targetOpacity - child.material.opacity) * 0.1;
        
        // Pulse ring if visible
        if (child.userData.isRing && isVisible) {
          const scale = 1 + Math.sin(time + destId.charCodeAt(0)) * 0.2;
          child.scale.set(scale, scale, scale);
        }
      });
      
      // Raycasting only if not dragging
      if (!isDragging) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(pinsGroup.children);
        
        if (intersects.length > 0) {
          // Find first non-ring intersect
          const hit = intersects.find(i => !i.object.userData.isRing && stateRef.current.filteredDestIds.includes(i.object.userData.id));
          if (hit) {
            const dest = hit.object.userData.dest;
            if (hoveredDestRef.current?.id !== dest.id) {
              hoveredDestRef.current = dest;
              setHoveredDest(dest);
              document.body.style.cursor = 'pointer';
            }
          } else {
            if (hoveredDestRef.current) {
              hoveredDestRef.current = null;
              setHoveredDest(null);
              document.body.style.cursor = 'default';
            }
          }
        } else {
          if (hoveredDestRef.current) {
            hoveredDestRef.current = null;
            setHoveredDest(null);
            document.body.style.cursor = 'default';
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        renderer.domElement.removeEventListener('click', onClick);
        renderer.domElement.removeEventListener('mousedown', onMouseDown);
        renderer.domElement.removeEventListener('mouseup', onMouseUp);
        renderer.domElement.removeEventListener('mouseleave', onMouseUp);
        renderer.domElement.removeEventListener('mousemove', onDragMove);
      }
      cancelAnimationFrame(requestRef.current);
      document.body.style.cursor = 'default';
      
      if (containerRef.current) containerRef.current.innerHTML = '';
      renderer.dispose();
      scene.clear();
    };
  }, [destinations, onPinClick]);

  return (
    <div className="relative w-full h-[500px] md:h-[600px] bg-[#FAF8F5]">
      {/* Globe Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
      
      {/* Search Overlay Gradient (to blend globe into content below) */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#FAF8F5] to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#FAF8F5] to-transparent pointer-events-none" />

      {/* Hover Tooltip Preview Card */}
      {hoveredDest && (
        <div 
          className="absolute z-50 pointer-events-none transition-opacity duration-300"
          style={{ 
            left: Math.min(tooltipPos.x + 15, containerRef.current?.clientWidth - 220), 
            top: Math.min(tooltipPos.y + 15, containerRef.current?.clientHeight - 80),
            opacity: 1 
          }}
        >
          <div className="bg-white/95 backdrop-blur-md rounded-xl p-2 shadow-[0_10px_30px_rgba(0,0,0,0.15)] border border-[#ECE8E2] w-52 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0" style={{ backgroundColor: hoveredDest.bgColor }}>
              {hoveredDest.imageUrl && (
                <img src={hoveredDest.imageUrl} alt={hoveredDest.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#1F1F1F] leading-tight">{hoveredDest.name}</h4>
              <p className="text-[10px] text-stone-500">{hoveredDest.country}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-yellow-400 text-[10px]">★</span>
                <span className="text-[10px] font-bold text-stone-600">{hoveredDest.rating}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
