import React from 'react'

function Header() {
    return (
        <header className="sticky top-0 z-50 w-full bg-brand-sand/80 backdrop-blur-md border-b border-brand-dark/10 transition-all">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo & Brand */}
                <div className="flex items-center cursor-pointer group">
                    <svg viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg" className="h-24 w-auto object-contain transition-transform duration-300 group-hover:scale-105">
                        <g transform="translate(30,28)">
                            <path 
                                d="M14 150 C 60 120, 90 95, 150 40"
                                fill="none" 
                                stroke="#5B7378" 
                                strokeWidth="3"
                                strokeDasharray="2 10" 
                                strokeLinecap="round" 
                            />
                            <circle cx="14" cy="150" r="7" fill="#0F5257" />
                            <g transform="translate(118,28) rotate(45)">
                                <path 
                                    d="M0 34 L8 0 L16 34 L34 44 L34 52 L16 46 L13 64 L21 70 L21 76 L8 70 L-5 76 L-5 70 L3 64 L0 46 L-18 52 L-18 44 Z"
                                    fill="#FF6B4A" 
                                />
                            </g>
                        </g>

                        <text 
                            x="245" 
                            y="115" 
                            fontFamily="'Helvetica Neue', Arial, sans-serif"
                            fontWeight="800" 
                            fontSize="64" 
                            letterSpacing="-1" 
                            fill="#16323A"
                        >
                            Trip<tspan fill="#FF6B4A">Wise</tspan>
                        </text>

                        <text 
                            x="248" 
                            y="148" 
                            fontFamily="'Helvetica Neue', Arial, sans-serif"
                            fontWeight="500" 
                            fontSize="18" 
                            letterSpacing="3" 
                            fill="#5B7378"
                        >
                            AI TRIP PLANNER
                        </text>
                    </svg>
                </div>

                {/* Navigation Links */}
                <nav className="hidden md:flex items-center gap-8">
                    {['Destinations', 'AI Planner', 'My Trips', 'Community'].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase().replace(' ', '-')}`}
                            className="text-[15px] font-semibold text-brand-dark/80 hover:text-brand-coral transition-colors duration-200 relative py-2 nav-link-underline"
                        >
                            {item}
                        </a>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <button className="px-5 py-2 text-[15px] font-semibold text-brand-dark/80 hover:text-brand-coral hover:bg-brand-coral/5 rounded-full transition-all duration-200">
                        Login
                    </button>
                    <button className="px-6 py-2.5 text-[15px] font-bold text-white bg-brand-coral rounded-full hover:bg-brand-dark hover:shadow-lg hover:shadow-brand-coral/20 active:scale-95 transition-all duration-200">
                        Sign Up
                    </button>
                </div>
            </div>
        </header>
    )
}

export default Header