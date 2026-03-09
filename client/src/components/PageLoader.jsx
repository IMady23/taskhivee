import React, { useState, useEffect } from 'react';
import CubeLoader from './CubeLoader';

export default function PageLoader({ children }) {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show loader for exactly 5 seconds
    const loaderDuration = 5000;

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setLoading(false);
      }, 800); // Fade out duration
    }, loaderDuration);

    return () => clearTimeout(timer);
  }, []);

  if (!loading) {
    return children;
  }

  return (
    <>
      <div
        style={{
          opacity: fadeOut ? 0 : 1,
          transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: fadeOut ? 'none' : 'auto',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 9999,
        }}
      >
        <CubeLoader />
      </div>
      <div
        style={{
          opacity: fadeOut ? 1 : 0,
          transition: 'opacity 0.6s ease-in 0.2s',
        }}
      >
        {children}
      </div>
    </>
  );
}
