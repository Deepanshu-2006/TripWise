import React from 'react';

export default function WorldMap({ className, pathRef }) {
    return (
        <div 
            ref={pathRef} 
            className={className}
            style={{
                backgroundImage: 'url(/physical_map.svg)',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
            }}
        />
    );
}