import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'md', 
  message = 'Loading...', 
  fullScreen = false,
  className = '',
  variant = 'default' // 'default', 'skeleton', 'pulse'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-50'
    : 'flex items-center justify-center p-4';

  if (variant === 'skeleton') {
    return (
      <div className={`${containerClasses} ${className}`}>
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`${containerClasses} ${className}`}>
        <div className="text-center">
          <div className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse mx-auto mb-2`}></div>
          {message && (
            <p className="text-gray-600 text-sm font-medium animate-pulse">{message}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600 mx-auto mb-2`} />
        {message && (
          <p className="text-gray-600 text-sm font-medium">{message}</p>
        )}
      </div>
    </div>
  );
};

// Skeleton loading component for specific UI elements
export const SkeletonLoader = ({ className = '', lines = 3, height = 'h-4' }) => {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={`bg-gray-200 rounded ${height} ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        ></div>
      ))}
    </div>
  );
};

// Page loading component with 3D cube animation
export const PageLoader = ({ message = 'Loading page...', showProgress = false, progress = 0 }) => {
  return (
    <div className="fixed inset-0 bg-[hsl(var(--background))] flex items-center justify-center z-50">
      <div className="text-center">
        {/* 3D Cube Loader */}
        <div className="cube-loader-mini">
          <div className="cube-mini cube-mini-0"><div></div></div>
          <div className="cube-mini cube-mini-1"><div></div></div>
          <div className="cube-mini cube-mini-2"><div></div></div>
          <div className="cube-mini cube-mini-3"><div></div></div>
          <div className="cube-mini cube-mini-4"><div></div></div>
          <div className="cube-mini cube-mini-5"><div></div></div>
        </div>
        
        {message && (
          <p className="text-[hsl(var(--muted-foreground))] text-sm font-medium mt-8 uppercase tracking-widest">
            {message}
          </p>
        )}
        
        {showProgress && (
          <div className="w-64 bg-[hsl(var(--border))] rounded-full h-1 mt-4 mx-auto">
            <div 
              className="bg-[hsl(var(--primary))] h-1 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        )}
      </div>
      
      <style>{`
        .cube-loader-mini {
          --duration: 1.6s;
          --primary: hsl(var(--primary));
          --cube-size: 32px;
          width: 120px;
          height: 180px;
          position: relative;
          transform-style: preserve-3d;
          margin: 0 auto;
        }

        .cube-mini {
          position: absolute;
          animation: cube-move-mini var(--duration) cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .cube-mini div {
          background-color: var(--primary);
          width: var(--cube-size);
          height: var(--cube-size);
          position: relative;
          transform-style: preserve-3d;
          animation: cube-scale-mini var(--duration) cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform: rotateY(-45deg) rotateX(-15deg) rotateZ(15deg) scale(0);
        }

        .cube-mini div:before,
        .cube-mini div:after {
          content: '';
          position: absolute;
          background-color: inherit;
          width: inherit;
          height: inherit;
        }

        .cube-mini div:before {
          transform: rotateX(90deg) translateZ(16px);
          filter: brightness(0.8);
        }

        .cube-mini div:after {
          transform: rotateY(90deg) translateZ(16px);
          filter: brightness(1.1);
        }

        .cube-mini-0 { left: 44px; top: 60px; }
        .cube-mini-1 { left: 44px; top: 60px; }
        .cube-mini-2 { left: 44px; top: 60px; }
        .cube-mini-3 { left: 44px; top: 90px; }
        .cube-mini-4 { left: 44px; top: 90px; }
        .cube-mini-5 { left: 44px; top: 30px; }

        @keyframes cube-move-mini {
          0%, 10% { transform: translate(var(--x, 0), var(--y, 0)); }
          25%, 75% { transform: translate(0, 0); }
          90%, 100% { transform: translate(0, 90px); }
        }

        @keyframes cube-scale-mini {
          0%, 5% { transform: rotateY(-45deg) rotateX(-15deg) rotateZ(15deg) scale(0); }
          15%, 100% { transform: rotateY(-45deg) rotateX(-15deg) rotateZ(15deg) scale(1); }
        }

        .cube-mini-0 { --x: 0px; --y: 0px; }
        .cube-mini-1 { --x: -60px; --y: 30px; animation-delay: 0.1s; }
        .cube-mini-2 { --x: 60px; --y: 30px; animation-delay: 0.2s; }
        .cube-mini-3 { --x: -30px; --y: -30px; animation-delay: 0.3s; }
        .cube-mini-4 { --x: 30px; --y: -30px; animation-delay: 0.4s; }
        .cube-mini-5 { --x: 0px; --y: 60px; animation-delay: 0.5s; }

        .cube-mini div { animation-delay: inherit; }

        .cube-loader-mini,
        .cube-mini,
        .cube-mini div,
        .cube-mini div:before,
        .cube-mini div:after {
          will-change: transform;
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;