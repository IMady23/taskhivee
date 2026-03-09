// components/EtherBackground.jsx
import React, { useRef, useEffect, useCallback } from 'react';

const EtherBackground = () => {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -10000, y: -10000, targetX: -10000, targetY: -10000 });
  const particles = useRef([]);
  const animationFrame = useRef(null);
  const resizeTimeout = useRef(null);

  // ---------- CONFIG – Tuned for TaskHive ----------
  const CONFIG = {
    RINGS: 3,                 // Fewer rings = cleaner
    PARTICLES_PER_RING: 300,  // ~900 particles total – buttery smooth
    MOUSE_RADIUS: 220,        // Size of the "void"
    RETURN_SPEED: 0.06,       // Slow, elegant return
    COLORS: [
      'hsla(195, 80%, 70%, 0.25)',  // Cyan, very faint
      'hsla(185, 70%, 65%, 0.2)',
      'hsla(200, 90%, 75%, 0.15)',
    ],
    BACKGROUND: '#050510',    // Matches your deep navy
    TWINKLE_SPEED: 0.003,
    SIZE_MIN: 1.2,
    SIZE_MAX: 2.8,
  };

  // ---------- Particle Class ----------
  class Particle {
    constructor(ringIndex, angle) {
      this.ringIndex = ringIndex;
      
      // Elliptical orbits – subtle perspective
      this.orbitRadiusX = 100 + ringIndex * 90;
      this.orbitRadiusY = (70 + ringIndex * 70) * 0.55;
      
      this.angle = angle;
      // Different speeds per ring, outer rings slower
      this.speed = 0.0008 + (ringIndex * 0.0002) + (Math.random() * 0.0003);
      
      // Appearance
      this.size = CONFIG.SIZE_MIN + Math.random() * (CONFIG.SIZE_MAX - CONFIG.SIZE_MIN);
      this.color = CONFIG.COLORS[ringIndex % CONFIG.COLORS.length];
      this.twinklePhase = Math.random() * 100;
      
      // Position state
      this.homeX = 0;
      this.homeY = 0;
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
    }

    update(centerX, centerY, mouseX, mouseY) {
      // 1. Orbital motion
      this.angle += this.speed;
      
      this.homeX = centerX + Math.cos(this.angle) * this.orbitRadiusX;
      this.homeY = centerY + Math.sin(this.angle) * this.orbitRadiusY;

      // 2. Mouse repulsion – exponential falloff, radial push
      const dx = this.homeX - mouseX;
      const dy = this.homeY - mouseY;
      const distance = Math.hypot(dx, dy);

      if (distance < CONFIG.MOUSE_RADIUS) {
        const force = (1 - (distance / CONFIG.MOUSE_RADIUS) ** 2) * 0.7;
        const angle = Math.atan2(dy, dx);
        const pushX = Math.cos(angle) * CONFIG.MOUSE_RADIUS * force;
        const pushY = Math.sin(angle) * CONFIG.MOUSE_RADIUS * force;
        
        const targetX = this.homeX + pushX;
        const targetY = this.homeY + pushY;
        
        this.vx += (targetX - this.x) * 0.12;
        this.vy += (targetY - this.y) * 0.12;
      } else {
        // Return to home with damping
        this.vx += (this.homeX - this.x) * CONFIG.RETURN_SPEED;
        this.vy += (this.homeY - this.y) * CONFIG.RETURN_SPEED;
      }

      // Apply velocity with friction
      this.vx *= 0.92;
      this.vy *= 0.92;
      this.x += this.vx;
      this.y += this.vy;
    }

    draw(ctx, now) {
      // Subtle twinkling using sine wave
      const twinkle = 0.5 + 0.5 * Math.sin(now * CONFIG.TWINKLE_SPEED + this.twinklePhase);
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      
      // Very soft glow
      ctx.shadowColor = 'rgba(100, 220, 255, 0.2)';
      ctx.shadowBlur = this.size * 2.5;
      ctx.fillStyle = this.color;
      ctx.globalAlpha = twinkle * 0.25; // Extremely faint – almost imperceptible
      ctx.fill();
      
      // Reset shadow for performance
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  // ---------- Initialize particles ----------
  const initParticles = useCallback(() => {
    const newParticles = [];
    for (let ring = 0; ring < CONFIG.RINGS; ring++) {
      const count = CONFIG.PARTICLES_PER_RING - ring * 15;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        newParticles.push(new Particle(ring, angle));
      }
    }
    particles.current = newParticles;
  }, []);

  // ---------- Resize handler with debounce ----------
  const handleResize = useCallback(() => {
    clearTimeout(resizeTimeout.current);
    resizeTimeout.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      initParticles();
    }, 100);
  }, [initParticles]);

  // ---------- Animation loop ----------
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx) return;

    // Smooth mouse interpolation
    mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.1;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.1;

    // Clear with background color
    ctx.fillStyle = CONFIG.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const now = performance.now();

    // Update and draw particles
    particles.current.forEach(p => {
      p.update(centerX, centerY, mouse.current.x, mouse.current.y);
      p.draw(ctx, now);
    });

    animationFrame.current = requestAnimationFrame(animate);
  }, []);

  // ---------- Setup and cleanup ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial sizing
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    initParticles();
    animate();

    // Event listeners
    const handleMouseMove = (e) => {
      mouse.current.targetX = e.clientX;
      mouse.current.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.current.targetX = -10000;
      mouse.current.targetY = -10000;
    };

    const handleTouchMove = (e) => {
      if (e.touches.length) {
        mouse.current.targetX = e.touches[0].clientX;
        mouse.current.targetY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      mouse.current.targetX = -10000;
      mouse.current.targetY = -10000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      clearTimeout(resizeTimeout.current);
    };
  }, [animate, handleResize, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
};

export default EtherBackground;
