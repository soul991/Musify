import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './landing.css';
import Landing from './Landing';

createRoot(document.getElementById('landing-root')!).render(
  <StrictMode>
    <Landing />
  </StrictMode>
);
