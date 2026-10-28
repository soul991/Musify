import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// 1. Instant boot warmup: ping backend /warm and prefetch /home before React mounts
const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';
try {
  fetch(`${API_BASE}/warm`).catch(() => {});
  fetch(`${API_BASE}/home`).catch(() => {});
} catch {}

// 2. Preload high-priority page chunks on browser idle
if (typeof window !== 'undefined') {
  const preloadChunks = () => {
    import('./pages/Home');
    import('./pages/Search');
  };
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(preloadChunks, { timeout: 1500 });
  } else {
    setTimeout(preloadChunks, 100);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
