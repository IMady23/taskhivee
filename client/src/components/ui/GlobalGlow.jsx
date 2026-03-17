import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

/**
 * GlobalGlow Component
 * Adds a premium, soft, radial glow effect that gently follows the user's mouse pointer
 * behind the content layer.
 */
export default function GlobalGlow() {
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });
  
  // Use springs to slightly lag behind the cursor for a "floating" feel
  const springConfig = { damping: 25, stiffness: 120, mass: 1 };
  const smoothX = useSpring(-1000, springConfig);
  const smoothY = useSpring(-1000, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      smoothX.set(e.clientX - 250); // Offset by half the width to center
      smoothY.set(e.clientY - 250); // Offset by half the height to center
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [smoothX, smoothY]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none opacity-[0.15]"
        style={{
          x: smoothX,
          y: smoothY,
          background: 'radial-gradient(circle, rgba(59,130,246,0.8) 0%, rgba(139,92,246,0.3) 40%, rgba(0,0,0,0) 70%)',
          filter: 'blur(40px)',
          mixBlendMode: 'screen' // Gives a more luminous look on dark backgrounds
        }}
      />
    </div>
  );
}
