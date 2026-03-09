import React, { useEffect, useRef } from 'react';

const ParticleBackground = () => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ 
        x: -10000, 
        y: -10000, 
        targetX: -10000, 
        targetY: -10000,
        prevX: -10000,
        prevY: -10000,
        velocity: 0
    });
    const particlesRef = useRef([]);
    const shootingStarRef = useRef(null);
    const lastShootingStarRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d', { alpha: false });
        let animationFrameId;
        let width, height;

        // ========== CONFIG ==========
        const RINGS = 4;
        const PARTICLES_PER_RING = 400;
        const MOUSE_RADIUS = 200;
        const RETURN_SPEED = 0.08;
        const COLORS = [
            'hsl(190, 80%, 70%)',
            'hsl(195, 70%, 65%)',
            'hsl(185, 90%, 75%)',
            'hsl(200, 60%, 60%)'
        ];

        // ========== HELPERS ==========
        const lerp = (start, end, t) => start * (1 - t) + end * t;

        // ========== PARTICLE CLASS ==========
        class Particle {
            constructor(ringIndex, angle) {
                this.ringIndex = ringIndex;
                
                // Ring geometry – elliptical for depth
                this.orbitRadiusX = 120 + (ringIndex * 105);
                this.orbitRadiusY = (80 + (ringIndex * 75)) * 0.6;
                
                this.angle = angle;
                // Outer rings rotate faster
                this.speed = 0.0015 + (ringIndex * 0.0007) + (Math.random() * 0.0005);
                
                // Visual
                this.size = 1.5 + Math.random() * 2.5;
                this.color = COLORS[ringIndex % COLORS.length];
                this.twinkleSpeed = 0.01 + Math.random() * 0.02;
                this.twinklePhase = Math.random() * 100;
                
                // Positions
                this.homeX = 0;
                this.homeY = 0;
                this.x = 0;
                this.y = 0;
                
                // Velocity
                this.vx = 0;
                this.vy = 0;
            }
            
            update(centerX, centerY, mouse) {
                // 1. Advance orbit
                this.angle += this.speed;
                
                // 2. Calculate home position
                this.homeX = centerX + Math.cos(this.angle) * this.orbitRadiusX;
                this.homeY = centerY + Math.sin(this.angle) * this.orbitRadiusY;
                
                // 3. Mouse repulsion with velocity influence
                const dx = this.homeX - mouse.x;
                const dy = this.homeY - mouse.y;
                const distance = Math.hypot(dx, dy);
                
                if (distance < MOUSE_RADIUS) {
                    // Exponential falloff + velocity multiplier
                    const force = (1 - (distance / MOUSE_RADIUS) ** 2) * 0.9 * (1 + mouse.velocity * 0.5);
                    
                    const angle = Math.atan2(dy, dx);
                    const pushX = Math.cos(angle) * MOUSE_RADIUS * force;
                    const pushY = Math.sin(angle) * MOUSE_RADIUS * force;
                    
                    const targetX = this.homeX + pushX;
                    const targetY = this.homeY + pushY;
                    
                    this.vx = lerp(this.vx, (targetX - this.x) * 0.2, 0.15);
                    this.vy = lerp(this.vy, (targetY - this.y) * 0.2, 0.15);
                } else {
                    this.vx = lerp(this.vx, (this.homeX - this.x) * RETURN_SPEED, 0.1);
                    this.vy = lerp(this.vy, (this.homeY - this.y) * RETURN_SPEED, 0.1);
                }
                
                this.x += this.vx;
                this.y += this.vy;
            }
            
            draw(ctx) {
                const twinkle = 0.6 + 0.4 * Math.sin(Date.now() * this.twinkleSpeed + this.twinklePhase);
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                
                ctx.shadowColor = 'rgba(100, 220, 255, 0.5)';
                ctx.shadowBlur = this.size * 2;
                ctx.fillStyle = this.color;
                ctx.globalAlpha = twinkle * 0.9;
                ctx.fill();
                
                ctx.shadowBlur = 0;
            }
        }

        // ========== SHOOTING STAR CLASS ==========
        class ShootingStar {
            constructor(width, height) {
                this.x = Math.random() * width;
                this.y = -50;
                this.vx = (Math.random() - 0.5) * 3;
                this.vy = 8 + Math.random() * 4;
                this.trail = [];
                this.trailLength = 20;
                this.life = 1;
                this.decay = 0.015;
            }
            
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= this.decay;
                
                this.trail.unshift({ x: this.x, y: this.y });
                if (this.trail.length > this.trailLength) {
                    this.trail.pop();
                }
            }
            
            draw(ctx) {
                for (let i = 0; i < this.trail.length; i++) {
                    const point = this.trail[i];
                    const alpha = (1 - i / this.trail.length) * this.life;
                    
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(100, 220, 255, ${alpha})`;
                    ctx.shadowColor = 'rgba(100, 220, 255, 0.8)';
                    ctx.shadowBlur = 10;
                    ctx.fill();
                }
                ctx.shadowBlur = 0;
            }
            
            isDead() {
                return this.life <= 0;
            }
        }

        // ========== INIT ==========
        const initParticles = () => {
            particlesRef.current = [];
            for (let ring = 0; ring < RINGS; ring++) {
                const count = PARTICLES_PER_RING - (ring * 20);
                for (let i = 0; i < count; i++) {
                    const angle = (i / count) * Math.PI * 2;
                    particlesRef.current.push(new Particle(ring, angle));
                }
            }
        };

        // ========== RESIZE ==========
        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initParticles();
        };

        // ========== ANIMATION ==========
        const animate = () => {
            // Clear with deep navy
            ctx.fillStyle = '#050510';
            ctx.fillRect(0, 0, width, height);
            
            const mouse = mouseRef.current;
            
            // Calculate mouse velocity
            const dx = mouse.targetX - mouse.prevX;
            const dy = mouse.targetY - mouse.prevY;
            mouse.velocity = Math.min(Math.hypot(dx, dy) / 10, 2);
            mouse.prevX = mouse.targetX;
            mouse.prevY = mouse.targetY;
            
            // Smooth mouse movement
            mouse.x = lerp(mouse.x, mouse.targetX, 0.15);
            mouse.y = lerp(mouse.y, mouse.targetY, 0.15);
            
            const centerX = width / 2;
            const centerY = height / 2;
            
            // Draw connecting lines (very faint)
            ctx.globalAlpha = 0.03;
            ctx.strokeStyle = 'hsl(190, 80%, 70%)';
            ctx.lineWidth = 0.5;
            
            for (let ring = 0; ring < RINGS; ring++) {
                const ringParticles = particlesRef.current.filter(p => p.ringIndex === ring);
                ctx.beginPath();
                for (let i = 0; i < ringParticles.length; i++) {
                    const p = ringParticles[i];
                    if (i === 0) {
                        ctx.moveTo(p.x, p.y);
                    } else {
                        ctx.lineTo(p.x, p.y);
                    }
                }
                ctx.closePath();
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1;
            
            // Update and draw particles
            for (let p of particlesRef.current) {
                p.update(centerX, centerY, mouse);
                p.draw(ctx);
            }
            
            // Shooting star logic
            const now = Date.now();
            if (now - lastShootingStarRef.current > 10000 && !shootingStarRef.current) {
                shootingStarRef.current = new ShootingStar(width, height);
                lastShootingStarRef.current = now;
            }
            
            if (shootingStarRef.current) {
                shootingStarRef.current.update();
                shootingStarRef.current.draw(ctx);
                
                if (shootingStarRef.current.isDead()) {
                    shootingStarRef.current = null;
                }
            }
            
            animationFrameId = requestAnimationFrame(animate);
        };

        // ========== EVENT LISTENERS ==========
        const handleMouseMove = (e) => {
            mouseRef.current.targetX = e.clientX;
            mouseRef.current.targetY = e.clientY;
        };

        const handleMouseLeave = () => {
            mouseRef.current.targetX = -10000;
            mouseRef.current.targetY = -10000;
        };

        const handleTouchMove = (e) => {
            if (e.touches.length) {
                mouseRef.current.targetX = e.touches[0].clientX;
                mouseRef.current.targetY = e.touches[0].clientY;
            }
        };

        const handleTouchEnd = () => {
            mouseRef.current.targetX = -10000;
            mouseRef.current.targetY = -10000;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleTouchEnd);

        handleResize();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

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
                pointerEvents: 'none'
            }}
        />
    );
};

export default ParticleBackground;
