import { sanitizeStorageOnBoot } from './utils/safeStorage';
// Immediately check and clean any bloated storage before React mounts
sanitizeStorageOnBoot();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initPWARegistration } from './utils/pwaUpdater';

// Initialize PWA with real-time update listeners & fast auto-reload
initPWARegistration();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
