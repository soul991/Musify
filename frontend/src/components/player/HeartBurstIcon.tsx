import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface HeartBurstIconProps {
  isLiked: boolean;
  onToggle?: () => void;
  size?: number; // default 24
  likedColor?: string; // default #E5303D
  unlikedColor?: string; // default currentColor
  className?: string;
}

export const HeartBurstIcon: React.FC<HeartBurstIconProps> = ({
  isLiked,
  onToggle,
  size = 24,
  likedColor = '#E5303D',
  unlikedColor = 'rgba(255, 255, 255, 0.7)',
  className = ''
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [animating, setAnimating] = useState(false);
  const prevLikedRef = useRef(isLiked);

  useEffect(() => {
    if (isLiked && !prevLikedRef.current) {
      if (!shouldReduceMotion) {
        setAnimating(true);
        const timer = setTimeout(() => setAnimating(false), 550);
        prevLikedRef.current = isLiked;
        return () => clearTimeout(timer);
      }
    }
    prevLikedRef.current = isLiked;
  }, [isLiked, shouldReduceMotion]);

  const particleCount = 6;
  const particleAngles = Array.from({ length: particleCount }, (_, i) => (i * 360) / particleCount);

  return (
    <div
      onClick={onToggle}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 6 Bursting Heart Particles shooting outward */}
      <AnimatePresence>
        {animating && !shouldReduceMotion && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {particleAngles.map((angle, index) => {
              const rad = (angle * Math.PI) / 180;
              const maxDist = size * 1.35;
              const targetX = Math.cos(rad) * maxDist;
              const targetY = Math.sin(rad) * maxDist;

              return (
                <motion.div
                  key={index}
                  initial={{ x: 0, y: 0, scale: 0.8, opacity: 1 }}
                  animate={{
                    x: targetX,
                    y: targetY,
                    scale: 0.4,
                    opacity: 0
                  }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="absolute"
                >
                  <Heart size={size * 0.35} fill={likedColor} stroke={likedColor} />
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Main Heart with Elastic Scale Pop */}
      <motion.div
        animate={{
          scale: animating && !shouldReduceMotion ? [1, 1.35, 0.95, 1.05, 1] : 1
        }}
        transition={shouldReduceMotion ? { duration: 0.1, ease: 'linear' } : { duration: 0.45, ease: 'easeOut' }}
      >
        <Heart
          size={size}
          className={`transition-colors ${shouldReduceMotion ? 'duration-100' : 'duration-200'}`}
          style={{
            fill: isLiked ? likedColor : 'transparent',
            color: isLiked ? likedColor : unlikedColor
          }}
        />
      </motion.div>
    </div>
  );
};
