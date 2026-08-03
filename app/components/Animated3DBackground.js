import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Map, Compass, Camera, Ticket, Globe2, Sparkles, MapPin } from 'lucide-react';

export default function Animated3DBackground() {
    const items = [
        { Icon: Plane, x: '12%', y: '20%', size: 70, delay: 0 },
        { Icon: Map, x: '82%', y: '18%', size: 90, delay: 1.5 },
        { Icon: Compass, x: '22%', y: '68%', size: 80, delay: 0.8 },
        { Icon: Camera, x: '78%', y: '72%', size: 75, delay: 2.2 },
        { Icon: Ticket, x: '50%', y: '12%', size: 60, delay: 3 },
        { Icon: Globe2, x: '45%', y: '82%', size: 95, delay: 1.2 },
        { Icon: Sparkles, x: '8%', y: '80%', size: 55, delay: 2.7 },
        { Icon: MapPin, x: '85%', y: '45%', size: 65, delay: 0.4 },
    ];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" style={{ perspective: '1200px' }}>
            {/* 3D Moving Perspective Grid */}
            <div className="absolute inset-0 origin-bottom" style={{ transform: 'rotateX(60deg) scale(2.5) translateY(20%)' }}>
                <motion.div 
                    animate={{ backgroundPosition: ['0px 0px', '0px 60px'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            {/* 3D Floating Glassmorphism Tiles */}
            {items.map((item, i) => (
                <motion.div
                    key={i}
                    initial={{ y: 0, rotateX: 30, rotateY: -20, rotateZ: 0 }}
                    animate={{ 
                        y: [-25, 25, -25], 
                        rotateX: [30, 45, 30], 
                        rotateY: [-20, 20, -20],
                        rotateZ: [-5, 15, -5] 
                    }}
                    transition={{ 
                        duration: 10 + i * 2, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        delay: item.delay
                    }}
                    className="absolute flex items-center justify-center bg-white/60 backdrop-blur-xl border border-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-3xl"
                    style={{
                        left: item.x,
                        top: item.y,
                        width: item.size,
                        height: item.size,
                        transformStyle: 'preserve-3d'
                    }}
                >
                    <item.Icon 
                        size={item.size * 0.4} 
                        className="text-[#FF6B2C]/80 drop-shadow-sm" 
                        strokeWidth={1.5} 
                        style={{ transform: 'translateZ(30px)' }}
                    />
                    
                    {/* Extruded inner layer for true 3D depth */}
                    <div 
                        className="absolute inset-0 bg-linear-to-br from-white/80 to-transparent rounded-3xl border border-white/50" 
                        style={{ transform: 'translateZ(15px)' }} 
                    />
                </motion.div>
            ))}
            
            {/* Soft radial mask to fade out edges */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(255,255,255,1)_85%)]" />
            <div className="absolute inset-0 bg-linear-to-b from-white/60 via-transparent to-white/90" />
        </div>
    );
}
