'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin } from 'lucide-react';

export default function Maplibre3DRouteMap({ activities, coordinates, onClose, destinationName }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [libsLoaded, setLibsLoaded] = useState(false);

  // Dynamically load MapLibre GL JS and CSS from CDN
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.maplibregl) {
      setLibsLoaded(true);
      return;
    }

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
    document.head.appendChild(link);

    // Load JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
    script.async = true;
    script.onload = () => {
      setLibsLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      // Clean up script if component unmounts before loading (optional)
    };
  }, []);

  useEffect(() => {
    if (!libsLoaded || !mapContainerRef.current || typeof window === 'undefined' || !window.maplibregl) return;

    const maplibregl = window.maplibregl;
    const center = coordinates ? [coordinates.lng, coordinates.lat] : [12.4964, 41.9028];

    // Initialize MapLibre GL
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', // Free public OSM vector tiles
      center: center,
      zoom: 13,
      pitch: 0, // Start flat
      bearing: 0,
      interactive: true
    });

    mapRef.current = map;

    map.on('load', () => {
      setIsMapReady(true);

      // 1. Add 3D Extruded Buildings Layer
      const allSources = map.getStyle().sources || {};
      const vectorSourceKey = Object.keys(allSources).find(key => {
        const src = allSources[key];
        return src && src.type === 'vector';
      }) || 'openmaptiles';

      try {
        map.addLayer({
          'id': '3d-buildings',
          'source': vectorSourceKey,
          'source-layer': 'building',
          'type': 'fill-extrusion',
          'minzoom': 13,
          'paint': {
            'fill-extrusion-color': '#e2ded7',
            'fill-extrusion-height': ['get', 'render_height'],
            'fill-extrusion-base': ['get', 'render_min_height'],
            'fill-extrusion-opacity': 0.75
          }
        });
      } catch (err) {
        console.warn("Could not load 3D buildings layer:", err);
      }

      // 2. Render Elevated Ribbon Route
      if (activities && activities.length > 0) {
        const lineCoords = activities.map(act => [
          act.coordinates?.lng || center[0],
          act.coordinates?.lat || center[1]
        ]);

        try {
          map.addSource('route', {
            'type': 'geojson',
            'data': {
              'type': 'Feature',
              'properties': {},
              'geometry': {
                'type': 'LineString',
                'coordinates': lineCoords
              }
            }
          });

          // Draw the main route line
          map.addLayer({
            'id': 'route-line',
            'type': 'line',
            'source': 'route',
            'layout': {
              'line-join': 'round',
              'line-cap': 'round'
            },
            'paint': {
              'line-color': '#BA5536',
              'line-width': 5,
              'line-opacity': 0.85
            }
          });

          // Draw elevated duplicate layer to represent ribbon shadow/glow
          map.addLayer({
            'id': 'route-shadow',
            'type': 'line',
            'source': 'route',
            'paint': {
              'line-color': '#e6dfd5',
              'line-width': 8,
              'line-opacity': 0.3,
              'line-offset': 2
            }
          });
        } catch (err) {
          console.warn("Could not draw route path:", err);
        }

        // 3. Draw Numbered Markers on Map
        activities.forEach((act, idx) => {
          const stopNum = idx + 1;
          const lat = act.coordinates?.lat || center[1];
          const lng = act.coordinates?.lng || center[0];

          const el = document.createElement('div');
          el.className = 'w-7 h-7 rounded-full bg-[#1E1C1A] text-white border-2 border-[#FAF6F0] flex items-center justify-center font-serif text-xs font-bold shadow-md cursor-pointer hover:bg-[#BA5536] transition-colors';
          el.innerText = stopNum;

          // Simple marker click interaction
          el.addEventListener('click', () => {
            map.easeTo({
              center: [lng, lat],
              zoom: 15.5,
              duration: 800
            });
          });

          new maplibregl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map);
        });
      }

      // 4. Animate Map Tilt-up over ~1.2s
      map.easeTo({
        pitch: 55,
        bearing: -12,
        zoom: 14.2,
        duration: 1200,
        easing: (t) => t * (2 - t) // Custom quad ease-out
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [libsLoaded, activities, coordinates]);

  // Clean tilt-down animation before triggering parent onClose callback
  const handleClose = () => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: 0,
        bearing: 0,
        zoom: 13,
        duration: 500,
        easing: (t) => t * t // ease-in
      });
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#FAF6F0] h-full w-full">
      {/* Overlay Header */}
      <div className="px-6 py-4 border-b border-[#E6DFD5] bg-white flex items-center justify-between shrink-0 z-10 shadow-xs">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#BA5536] font-bold block">
            Maplibre 3D Engine
          </span>
          <h3 className="text-lg sm:text-xl font-serif font-black text-[#1E1C1A]">
            Interactive 3D Route Overview
          </h3>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 rounded-full border border-[#E6DFD5] bg-[#FAF6F0] hover:bg-[#1E1C1A] hover:text-white text-xs font-sans font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <X className="w-4 h-4" />
          <span>Close Map Overlay</span>
        </button>
      </div>

      {/* Mapbox container */}
      <div className="flex-1 w-full h-full relative">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
        
        {!isMapReady && (
          <div className="absolute inset-0 bg-[#FAF6F0] flex flex-col items-center justify-center font-serif z-30">
            <div className="w-8 h-8 rounded-full border-2 border-[#BA5536] border-t-transparent animate-spin mb-3" />
            <p className="text-xs italic text-[#7A7268]">Rendering 3D terrain grids...</p>
          </div>
        )}
      </div>

      {/* Overlay Footer */}
      <div className="px-6 py-3 border-t border-[#E6DFD5] bg-white flex items-center justify-between text-xs font-sans text-[#7A7268] shrink-0 z-10">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#BA5536]" />
          <span>Click numbered stops to target camera location.</span>
        </span>
        <span className="font-bold text-[#1E1C1A] uppercase tracking-wider text-[10px]">OSM 3D Vector Tiles</span>
      </div>
    </div>
  );
}
