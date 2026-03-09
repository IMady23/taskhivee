import { useEffect, useRef } from 'react';
import './CubeLoader.css';

export default function CubeLoader() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e) => {
      const particles = container.querySelectorAll('.orbit-particle');
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      particles.forEach((particle) => {
        const deltaX = (e.clientX - centerX) * 0.02;
        const deltaY = (e.clientY - centerY) * 0.02;
        particle.style.setProperty('--mouse-x', `${deltaX}px`);
        particle.style.setProperty('--mouse-y', `${deltaY}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="cube-loader-container" ref={containerRef}>
      {/* Animated background gradient */}
      <div className="loader-bg-gradient"></div>

      {/* Orbiting particles system */}
      <div className="orbit-system">
        {/* Center pulsing ring */}
        <div className="center-ring">
          <div className="ring-inner"></div>
        </div>

        {/* 8 orbiting particles at different speeds/distances */}
        <div className="orbit-particle orbit-1"></div>
        <div className="orbit-particle orbit-2"></div>
        <div className="orbit-particle orbit-3"></div>
        <div className="orbit-particle orbit-4"></div>
        <div className="orbit-particle orbit-5"></div>
        <div className="orbit-particle orbit-6"></div>
        <div className="orbit-particle orbit-7"></div>
        <div className="orbit-particle orbit-8"></div>
      </div>

      {/* Premium animated text */}
      <div className="loader-text-wrapper">
        <h2 className="loader-title">
          <span className="letter">L</span>
          <span className="letter">O</span>
          <span className="letter">A</span>
          <span className="letter">D</span>
          <span className="letter">I</span>
          <span className="letter">N</span>
          <span className="letter">G</span>
          <span className="letter-space"></span>
          <span className="letter">T</span>
          <span className="letter">A</span>
          <span className="letter">S</span>
          <span className="letter">K</span>
          <span className="letter">H</span>
          <span className="letter">I</span>
          <span className="letter">V</span>
          <span className="letter">E</span>
        </h2>
        <div className="loader-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
}
