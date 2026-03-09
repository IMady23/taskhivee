// components/DevSymbolsBackground.jsx
import { useRef, useEffect, useCallback } from 'react';

const DevSymbolsBackground = () => {
  const canvasRef = useRef(null);
  const symbols = useRef([]);
  const mouse = useRef({ x: null, y: null });
  const prevMouse = useRef({ x: null, y: null });
  const animationFrame = useRef(null);

  // Configuration
  const CONFIG = {
    SYMBOL_COUNT: 50, // More symbols
    SYMBOL_SPEED: 0.5,
    CONNECTION_DISTANCE: 250,
    MOUSE_ATTRACTION_RADIUS: 350,
    MOUSE_ATTRACTION_FORCE: 0.6,
    LINE_WIDTH: 1,
    FPS_CAP: 60,
  };

  // Dev symbols to render
  const DEV_SYMBOLS = [
    '{ }',
    '</>',
    '✓',
    '→',
    '⚡',
    '◆',
    '●',
    '▲',
  ];

  // Symbol class
  class Symbol {
    constructor(canvas, fromEdge = false) {
      if (fromEdge) {
        // Spawn from random edge
        const edge = Math.floor(Math.random() * 4);
        switch(edge) {
          case 0: // top
            this.x = Math.random() * canvas.width;
            this.y = -50;
            break;
          case 1: // right
            this.x = canvas.width + 50;
            this.y = Math.random() * canvas.height;
            break;
          case 2: // bottom
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + 50;
            break;
          case 3: // left
            this.x = -50;
            this.y = Math.random() * canvas.height;
            break;
        }
      } else {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
      }
      
      this.vx = (Math.random() - 0.5) * CONFIG.SYMBOL_SPEED;
      this.vy = (Math.random() - 0.5) * CONFIG.SYMBOL_SPEED;
      this.symbol = DEV_SYMBOLS[Math.floor(Math.random() * DEV_SYMBOLS.length)];
      this.baseSize = 24 + Math.random() * 16; // Fixed base size (24-40px)
      this.size = this.baseSize; // Current size (stays constant)
      this.opacity = 0.3 + Math.random() * 0.3; // More visible (0.3-0.6)
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.02;
      this.attached = false; // Track if attached to cursor
      this.attachOffset = { x: 0, y: 0 }; // Offset from cursor when attached
    }

    update(canvas, mouseX, mouseY, prevMouseX, prevMouseY) {
      // Mouse attachment/detachment logic
      if (mouseX !== null && mouseY !== null) {
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Calculate mouse movement speed
        let mouseSpeed = 0;
        if (prevMouseX !== null && prevMouseY !== null) {
          const mdx = mouseX - prevMouseX;
          const mdy = mouseY - prevMouseY;
          mouseSpeed = Math.sqrt(mdx * mdx + mdy * mdy);
        }

        // Attach if close and mouse is slow/stationary
        if (!this.attached && distance < 100 && mouseSpeed < 5) {
          this.attached = true;
          this.attachOffset.x = this.x - mouseX;
          this.attachOffset.y = this.y - mouseY;
          this.vx = 0;
          this.vy = 0;
        }

        // Detach if mouse moves fast
        if (this.attached && mouseSpeed > 10) {
          this.attached = false;
          // Give it a velocity away from cursor
          const angle = Math.atan2(dy, dx) + Math.PI; // Opposite direction
          this.vx = Math.cos(angle) * 2;
          this.vy = Math.sin(angle) * 2;
        }

        // If attached, follow cursor with offset
        if (this.attached) {
          this.x = mouseX + this.attachOffset.x;
          this.y = mouseY + this.attachOffset.y;
          this.vx = 0;
          this.vy = 0;
        } else {
          // Free floating - gentle drift
          if (distance < CONFIG.MOUSE_ATTRACTION_RADIUS) {
            // Subtle attraction when not attached
            const force = ((CONFIG.MOUSE_ATTRACTION_RADIUS - distance) / CONFIG.MOUSE_ATTRACTION_RADIUS) * 0.1;
            const angle = Math.atan2(dy, dx);
            this.vx += Math.cos(angle) * force;
            this.vy += Math.sin(angle) * force;
          }
        }
      } else {
        // No mouse - detach and float freely
        this.attached = false;
      }

      // Only update position if not attached
      if (!this.attached) {
        // Apply damping
        this.vx *= 0.95;
        this.vy *= 0.95;

        // Update position
        this.x += this.vx;
        this.y += this.vy;
      }

      // Always rotate
      this.rotation += this.rotationSpeed;

      // Check if out of bounds (for respawning)
      this.outOfBounds = (
        this.x < -100 || this.x > canvas.width + 100 ||
        this.y < -100 || this.y > canvas.height + 100
      );

      // Bounce off edges (soft bounce) - only if not attached
      if (!this.attached) {
        if (this.x < 0 || this.x > canvas.width) {
          this.vx *= -0.5;
          this.x = Math.max(0, Math.min(canvas.width, this.x));
        }
        if (this.y < 0 || this.y > canvas.height) {
          this.vy *= -0.5;
          this.y = Math.max(0, Math.min(canvas.height, this.y));
        }
      }
    }

    draw(ctx, color) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      // Use baseSize to ensure consistent rendering
      ctx.font = `bold ${this.baseSize}px "Fira Code", "Courier New", monospace`;
      ctx.fillStyle = color.replace('OPACITY', this.opacity);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.symbol, 0, 0);
      ctx.restore();
    }
  }

  // Get CSS variable colors
  const getColors = useCallback(() => {
    const root = getComputedStyle(document.documentElement);
    const isDark = root.getPropertyValue('--bg-primary')?.trim().startsWith('#0') || 
                   document.documentElement.classList.contains('dark');

    if (isDark) {
      return {
        symbolColor: 'rgba(100, 150, 255, OPACITY)',
        lineColor: 'rgba(100, 150, 255, 0.08)',
        background: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')?.trim() || '#0B0F14',
      };
    } else {
      return {
        symbolColor: 'rgba(60, 100, 180, OPACITY)',
        lineColor: 'rgba(60, 100, 180, 0.06)',
        background: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')?.trim() || '#ffffff',
      };
    }
  }, []);

  // Initialize symbols
  const initSymbols = useCallback((canvas) => {
    symbols.current = [];
    for (let i = 0; i < CONFIG.SYMBOL_COUNT; i++) {
      symbols.current.push(new Symbol(canvas));
    }
  }, []);

  // Draw connections between symbols
  const drawConnections = useCallback(() => {
    // NO CONNECTIONS - symbols are individual
    return;
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const colors = getColors();

    // Clear canvas with background color
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw connections first (behind symbols)
    drawConnections();

    // Update and draw symbols
    symbols.current.forEach((symbol) => {
      symbol.update(canvas, mouse.current.x, mouse.current.y, prevMouse.current.x, prevMouse.current.y);
      symbol.draw(ctx, colors.symbolColor);
    });

    // Update previous mouse position
    prevMouse.current.x = mouse.current.x;
    prevMouse.current.y = mouse.current.y;

    // Remove out-of-bounds symbols and spawn new ones from edges
    symbols.current = symbols.current.filter(s => !s.outOfBounds);
    
    // Maintain symbol count by spawning from edges
    while (symbols.current.length < CONFIG.SYMBOL_COUNT) {
      symbols.current.push(new Symbol(canvas, true));
    }

    // Cap at 60fps
    setTimeout(() => {
      animationFrame.current = requestAnimationFrame(animate);
    }, 1000 / CONFIG.FPS_CAP);
  }, [getColors, drawConnections]);

  // Handle resize
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Set canvas size WITHOUT scaling for consistent symbol sizes
    canvas.width = rect.width;
    canvas.height = rect.height;

    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    initSymbols(canvas);
  }, [initSymbols]);

  // Setup and cleanup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial setup
    handleResize();
    animate();

    // Mouse move handler - track on WINDOW for full page coverage
    const handleMouseMove = (e) => {
      prevMouse.current.x = mouse.current.x;
      prevMouse.current.y = mouse.current.y;
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    // Mouse leave handler
    const handleMouseLeave = () => {
      mouse.current.x = null;
      mouse.current.y = null;
      prevMouse.current.x = null;
      prevMouse.current.y = null;
    };

    // Event listeners
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

export default DevSymbolsBackground;
