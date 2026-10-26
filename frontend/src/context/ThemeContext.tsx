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

export const DEFAULT_ACCENT = '#E5303D'; // Musify Calm Red Accent
export const DEFAULT_SECONDARY = '#B8222E'; // Restrained Accent 2

export const CALM_ACCENT_PRESETS = [
  { name: 'Musify Red (Default)', hex: '#E5303D' },
  { name: 'Sage Olive', hex: '#5E7A68' },
  { name: 'Dusk Slate', hex: '#4F6382' },
  { name: 'Warm Clay', hex: '#A86542' },
  { name: 'Deep Pine', hex: '#446E6D' },
  { name: 'Ash Graphite', hex: '#7A7D84' }
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Advanced palette extractor for dynamic soothing ambient lighting (cached per track)
const colorCache = new Map<string, { primary: string; secondary: string }>();

async function extractPalette(imgSrc: string): Promise<{ primary: string; secondary: string }> {
  if (colorCache.has(imgSrc)) {
    return colorCache.get(imgSrc)!;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imgSrc;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve({ primary: DEFAULT_ACCENT, secondary: DEFAULT_SECONDARY });

        canvas.width = 48;
        canvas.height = 48;
        ctx.drawImage(img, 0, 0, 48, 48);

        const data = ctx.getImageData(0, 0, 48, 48).data;
        let bestVibrant = { r: 229, g: 48, b: 61, score: 0 };
        let bestDark = { r: 40, g: 20, b: 24, score: 0 };

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          const brightness = (r + g + b) / 3;

          // Soothing primary: moderate saturation, subdued brightness (not neon)
          if (brightness > 40 && brightness < 180 && sat > 0.2) {
            const score = sat * 1.2 + (brightness / 255);
            if (score > bestVibrant.score) {
              bestVibrant = { r, g, b, score };
            }
          }

          // Rich secondary: darker, calm
          if (brightness > 15 && brightness < 90 && sat > 0.1) {
            const score = sat + (1 - brightness / 255);
            if (score > bestDark.score) {
              bestDark = { r, g, b, score };
            }
          }
        }

        const toHex = (c: { r: number; g: number; b: number }) =>
          `#${((1 << 24) + (c.r << 16) + (c.g << 8) + c.b).toString(16).slice(1)}`;

        const result = {
          primary: toHex(bestVibrant),
          secondary: toHex(bestDark)
        };
        colorCache.set(imgSrc, result);
        resolve(result);
      } catch {
        resolve({ primary: DEFAULT_ACCENT, secondary: DEFAULT_SECONDARY });
      }
    };
    img.onerror = () => resolve({ primary: DEFAULT_ACCENT, secondary: DEFAULT_SECONDARY });
  });
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 229;
  const g = parseInt(clean.substring(2, 4), 16) || 48;
  const b = parseInt(clean.substring(4, 6), 16) || 61;
  return `${r}, ${g}, ${b}`;
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accentColor, setAccentColorState] = useState<string>(() => {
    const saved = localStorage.getItem('musify_accent_color');
    // If old pink/coral #ED5564 was saved, reset to #E5303D
    if (saved && saved.toUpperCase() === '#ED5564') {
      return DEFAULT_ACCENT;
    }
    return saved || DEFAULT_ACCENT;
  });

  const [pureBlack, setPureBlackState] = useState<boolean>(() => {
    return localStorage.getItem('musify_pure_black') === 'true';
  });

  const [playerStyle, setPlayerStyleState] = useState<'apple' | 'material'>(() => {
    return (localStorage.getItem('musify_player_style') as 'apple' | 'material') || 'apple';
  });

  const [dynamicColor, setDynamicColor] = useState<string>(DEFAULT_ACCENT);
  const [dynamicSecondary, setDynamicSecondary] = useState<string>(DEFAULT_SECONDARY);

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
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
    if (!imageUrl) {
      setDynamicColor(DEFAULT_ACCENT);
      setDynamicSecondary(DEFAULT_SECONDARY);
      return;
    }
    const { primary, secondary } = await extractPalette(imageUrl);
    setDynamicColor(primary);
    setDynamicSecondary(secondary);
  };

  const bgDark = pureBlack ? '#000000' : '#0A0A0A';

  useEffect(() => {
    const root = document.documentElement;
    const rgb = hexToRgb(accentColor);

    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--accent-rgb', rgb);
    root.style.setProperty('--bg-primary', bgDark);
  }, [accentColor, pureBlack, bgDark]);

  const colors: ThemeColors = {
    primary: dynamicColor || accentColor,
    primaryRgb: hexToRgb(dynamicColor || accentColor),
    secondary: dynamicSecondary,
    secondaryRgb: hexToRgb(dynamicSecondary),
    bgDark,
    // Very subtle, soothing ambient gradient (12-16% opacity)
    gradientBackground: `radial-gradient(ellipse 70% 50% at 50% -5%, ${dynamicColor}20 0%, ${dynamicSecondary}12 45%, ${bgDark} 100%)`
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
