// components/QuantumBackground.jsx
import { useRef, useEffect, useCallback } from 'react';

const QuantumBackground = () => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const mouse = useRef({ x: null, y: null });
  const animationFrame = useRef(null);

  // Configuration - Larger & Slower
  const CONFIG = {
    PARTICLE_COUNT: window.innerWidth < 768 ? 60 : 120,
    PARTICLE_RADIUS: 3.5, // Larger particles (was 3)
    PARTICLE_SPEED_MIN: 0.08, // Slower (was 0.15)
    PARTICLE_SPEED_MAX: 0.25, // Slower (was 0.4)
    CONNECTION_DISTANCE: 150,
    MOUSE_RADIUS: 200,
    MOUSE_FORCE: 0.15,
    LINE_WIDTH: 1,
    LINE_OPACITY_BASE: 0.4,
    FPS_CAP: 60,
    VELOCITY_DAMPING: 0.98,
    GLOW_BLUR: 12, // Slightly more glow for larger particles
  };

  // Particle class with depth layering
  class Particle {
    constructor(canvas) {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      
      // Depth factor for parallax effect (0.5 to 1.0)
      this.depth = 0.5 + Math.random() * 0.5;
      
      // Speed based on depth
      const baseSpeed = CONFIG.PARTICLE_SPEED_MIN + Math.random() * (CONFIG.PARTICLE_SPEED_MAX - CONFIG.PARTICLE_SPEED_MIN);
      this.vx = (Math.random() - 0.5) * baseSpeed * this.depth;
      this.vy = (Math.random() - 0.5) * baseSpeed * this.depth;
      
      // Size based on depth
      this.radius = CONFIG.PARTICLE_RADIUS * this.depth;
      
      // Sine-based drift for organic motion
      this.driftOffset = Math.random() * Math.PI * 2;
      this.driftSpeed = 0.001 + Math.random() * 0.002;
    }

    update(canvas, mouseX, mouseY, time) {
      // Stronger cursor interaction - repel effect
      if (mouseX !== null && mouseY !== null) {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CONFIG.MOUSE_RADIUS && distance > 0) {
          // Stronger repel with easing
          const force = ((CONFIG.MOUSE_RADIUS - distance) / CONFIG.MOUSE_RADIUS) * CONFIG.MOUSE_FORCE;
          const angle = Math.atan2(dy, dx);
          this.vx += Math.cos(angle) * force;
          this.vy += Math.sin(angle) * force;
        }
      }

      // Sine-based organic drift
      this.driftOffset += this.driftSpeed;
      const driftX = Math.sin(this.driftOffset) * 0.03;
      const driftY = Math.cos(this.driftOffset * 1.3) * 0.03;
      this.vx += driftX;
      this.vy += driftY;

      // Velocity damping (less aggressive)
      this.vx *= CONFIG.VELOCITY_DAMPING;
      this.vy *= CONFIG.VELOCITY_DAMPING;

      // Update position
      this.x += this.vx;
      this.y += this.vy;

      // Wrap around edges (seamless loop)
      if (this.x < -10) this.x = canvas.width + 10;
      if (this.x > canvas.width + 10) this.x = -10;
      if (this.y < -10) this.y = canvas.height + 10;
      if (this.y > canvas.height + 10) this.y = -10;
    }

    draw(ctx, dotColor, dotOpacity) {
      // Subtle glow effect
      ctx.shadowBlur = CONFIG.GLOW_BLUR;
      ctx.shadowColor = dotColor.replace('OPACITY', dotOpacity * 0.8);
      
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = dotColor.replace('OPACITY', dotOpacity * this.depth);
      ctx.fill();
      
      // Reset shadow for lines
      ctx.shadowBlur = 0;
    }
  }

  // Get CSS variable colors - More Visible
  const getColors = useCallback(() => {
    const root = getComputedStyle(document.documentElement);
    const isDark = root.getPropertyValue('--bg-primary')?.trim().startsWith('#0') || 
                   document.documentElement.classList.contains('dark');

    if (isDark) {
      return {
        dotColor: 'rgba(120, 180, 255, OPACITY)',
        dotOpacity: 0.8, // More visible (was 0.65)
        lineColor: 'rgba(120, 180, 255, OPACITY)',
        lineOpacity: 0.3, // More visible (was 0.18)
        background: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')?.trim() || '#0B0F14',
      };
    } else {
      return {
        dotColor: 'rgba(40, 70, 140, OPACITY)',
        dotOpacity: 0.6, // More visible (was 0.45)
        lineColor: 'rgba(40, 70, 140, OPACITY)',
        lineOpacity: 0.2, // More visible (was 0.12)
        background: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')?.trim() || '#ffffff',
      };
    }
  }, []);

  // Initialize particles
  const initParticles = useCallback((canvas) => {
    particles.current = [];
    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
      particles.current.push(new Particle(canvas));
    }
  }, []);

  // Draw connections between particles - Whisper-light
  const drawConnections = useCallback((ctx, colors, mouseX, mouseY) => {
    const maxDistance = CONFIG.CONNECTION_DISTANCE;
    
    for (let i = 0; i < particles.current.length; i++) {
      for (let j = i + 1; j < particles.current.length; j++) {
        const p1 = particles.current[i];
        const p2 = particles.current[j];
        
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          // Distance-based opacity fade
          let opacity = (1 - (distance / maxDistance)) * CONFIG.LINE_OPACITY_BASE;
          
          // Increase opacity slightly when cursor is near
          if (mouseX !== null && mouseY !== null) {
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const distToMouse = Math.sqrt((midX - mouseX) ** 2 + (midY - mouseY) ** 2);
            
            if (distToMouse < CONFIG.MOUSE_RADIUS) {
              opacity *= 1.3; // Subtle enhancement
            }
          }
          
          ctx.beginPath();
          ctx.strokeStyle = colors.lineColor.replace('OPACITY', opacity);
          ctx.lineWidth = CONFIG.LINE_WIDTH;
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    }
  }, []);

  // Animation loop with performance guard
  const animate = useCallback((time = 0) => {
    // Pause when tab is hidden
    if (document.hidden) {
      animationFrame.current = requestAnimationFrame(animate);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const colors = getColors();

    // Clear canvas with background color
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw connections first (behind particles)
    drawConnections(ctx, colors, mouse.current.x, mouse.current.y);

    // Update and draw particles
    particles.current.forEach((particle) => {
      particle.update(canvas, mouse.current.x, mouse.current.y, time);
      particle.draw(ctx, colors.dotColor, colors.dotOpacity);
    });

    // Cap at 60fps
    setTimeout(() => {
      animationFrame.current = requestAnimationFrame(animate);
    }, 1000 / CONFIG.FPS_CAP);
  }, [getColors, drawConnections]);

  // Handle resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    initParticles(canvas);
  }, [initParticles]);

  // Setup and cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial setup
    handleResize();
    animate();

    // Mouse move handler - track on WINDOW for full page coverage
    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    // Mouse leave handler
    const handleMouseLeave = () => {
      mouse.current.x = null;
      mouse.current.y = null;
    };

    // Event listeners on WINDOW (not canvas)
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);

      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [animate, handleResize]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
};

export default QuantumBackground;
