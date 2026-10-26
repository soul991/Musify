import React, { useState, useEffect } from 'react';
import { CalmSeekbar } from './CalmSeekbar';
import { SquigglySlider } from './SquigglySlider';

interface AdaptiveSeekbarProps {
  value: number;
  max: number;
  isPlaying: boolean;
  accentColor?: string;
  onSeek: (value: number) => void;
  className?: string;
  showTimestamps?: boolean;
}

export const AdaptiveSeekbar: React.FC<AdaptiveSeekbarProps> = ({
  value,
  max,
  isPlaying,
  accentColor = 'var(--accent-color, #E5303D)',
  onSeek,
  className = '',
  showTimestamps = false
}) => {
  const [style, setStyle] = useState<'calm' | 'squiggly'>(() => {
    return (localStorage.getItem('musify_seekbar_style') as 'calm' | 'squiggly') || 'calm';
  });

  useEffect(() => {
    const handleStorage = () => {
      const current = (localStorage.getItem('musify_seekbar_style') as 'calm' | 'squiggly') || 'calm';
      setStyle(current);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (style === 'squiggly') {
    return (
      <SquigglySlider
        value={value}
        max={max}
        isPlaying={isPlaying}
        accentColor={accentColor}
        onSeek={onSeek}
        className={className}
      />
    );
  }

  return (
    <CalmSeekbar
      value={value}
      max={max}
      accentColor={accentColor}
      onSeek={onSeek}
      className={className}
      showTimestamps={showTimestamps}
    />
  );
};
