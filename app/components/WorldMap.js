import React from 'react';

export default function WorldMap({ className, pathRef }) {
    return (
        <div 
            ref={pathRef} 
            className={className}
            style={{
                WebkitMaskImage: 'url(/physical_map.svg)',
                maskImage: 'url(/physical_map.svg)',
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                backgroundColor: 'currentColor'
            }}
        />
    );
}