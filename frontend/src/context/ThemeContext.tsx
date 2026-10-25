import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  primary: string;
  primaryRgb: string;
  secondary: string;
  secondaryRgb: string;
  bgDark: string;
  gradientBackground: string;
}

interface ThemeContextType {
  accentColor: string;
  setAccentColor: (color: string) => void;
  pureBlack: boolean;
  setPureBlack: (enabled: boolean) => void;
  colors: ThemeColors;
  playerStyle: 'apple' | 'material';
  setPlayerStyle: (style: 'apple' | 'material') => void;
  extractColorsFromImage: (imageUrl: string) => void;
}

const DEFAULT_ACCENT = '#ED5564'; // Echo Music Default Coral Seed
const DEFAULT_SECONDARY = '#4A2530';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Advanced palette extractor matching Echo Music's PlayerColorExtractor.kt
async function extractPalette(imgSrc: string): Promise<{ primary: string; secondary: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imgSrc;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve({ primary: DEFAULT_ACCENT, secondary: DEFAULT_SECONDARY });

        canvas.width = 64;
        canvas.height = 64;
        ctx.drawImage(img, 0, 0, 64, 64);

        const data = ctx.getImageData(0, 0, 64, 64).data;
        let bestVibrant = { r: 237, g: 85, b: 100, score: 0 };
        let bestDark = { r: 74, g: 37, b: 48, score: 0 };

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          const brightness = (r + g + b) / 3;

          // Vibrant primary: good saturation, moderate to high brightness
          if (brightness > 60 && brightness < 220 && sat > 0.25) {
            const score = sat * 1.5 + (brightness / 255);
            if (score > bestVibrant.score) {
              bestVibrant = { r, g, b, score };
            }
          }

          // Rich secondary: darker, complementary
          if (brightness > 20 && brightness < 110 && sat > 0.15) {
            const score = sat + (1 - brightness / 255);
            if (score > bestDark.score) {
              bestDark = { r, g, b, score };
            }
          }
        }

        const toHex = (c: { r: number; g: number; b: number }) =>
          `#${((1 << 24) + (c.r << 16) + (c.g << 8) + c.b).toString(16).slice(1)}`;

        resolve({
          primary: toHex(bestVibrant),
          secondary: toHex(bestDark)
        });
      } catch {
        resolve({ primary: DEFAULT_ACCENT, secondary: DEFAULT_SECONDARY });
      }
    };
    img.onerror = () => resolve({ primary: DEFAULT_ACCENT, secondary: DEFAULT_SECONDARY });
  });
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 237;
  const g = parseInt(clean.substring(2, 4), 16) || 85;
  const b = parseInt(clean.substring(4, 6), 16) || 100;
  return `${r}, ${g}, ${b}`;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem('musify_accent_color') || DEFAULT_ACCENT;
  });

  const [pureBlack, setPureBlackState] = useState<boolean>(() => {
    return localStorage.getItem('musify_pure_black') === 'true';
  });

  const [playerStyle, setPlayerStyleState] = useState<'apple' | 'material'>(() => {
    return (localStorage.getItem('musify_player_style') as 'apple' | 'material') || 'apple';
  });

  const [dynamicColor, setDynamicColor] = useState<string>(accentColor);
  const [dynamicSecondary, setDynamicSecondary] = useState<string>(DEFAULT_SECONDARY);

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    setDynamicColor(color);
    localStorage.setItem('musify_accent_color', color);
  };

  const setPureBlack = (enabled: boolean) => {
    setPureBlackState(enabled);
    localStorage.setItem('musify_pure_black', String(enabled));
  };

  const setPlayerStyle = (style: 'apple' | 'material') => {
    setPlayerStyleState(style);
    localStorage.setItem('musify_player_style', style);
  };

  const extractColorsFromImage = async (imageUrl: string) => {
    if (!imageUrl) return;
    const { primary, secondary } = await extractPalette(imageUrl);
    setDynamicColor(primary);
    setDynamicSecondary(secondary);
  };

  const bgDark = pureBlack ? '#000000' : '#0D0E12';

  useEffect(() => {
    const root = document.documentElement;
    const activeColor = dynamicColor || accentColor;
    const rgb = hexToRgb(activeColor);

    root.style.setProperty('--accent-color', activeColor);
    root.style.setProperty('--accent-rgb', rgb);
    root.style.setProperty('--bg-primary', bgDark);
  }, [dynamicColor, accentColor, pureBlack, bgDark]);

  const colors: ThemeColors = {
    primary: dynamicColor || accentColor,
    primaryRgb: hexToRgb(dynamicColor || accentColor),
    secondary: dynamicSecondary,
    secondaryRgb: hexToRgb(dynamicSecondary),
    bgDark,
    gradientBackground: `radial-gradient(ellipse 80% 60% at 50% -10%, ${dynamicColor}45 0%, ${dynamicSecondary}30 50%, ${bgDark} 100%)`
  };

  return (
    <ThemeContext.Provider
      value={{
        accentColor,
        setAccentColor,
        pureBlack,
        setPureBlack,
        colors,
        playerStyle,
        setPlayerStyle,
        extractColorsFromImage
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
