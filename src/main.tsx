import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';

// Only register Service Worker in production builds; in dev, clear any stale SW/caches
// so Vite module graphs and React chunks always share the same version hash.
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('PWA Service Worker registered successfully with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('PWA Service Worker registration failed:', error);
        });
    });
  } else {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((reg) => {
          reg.unregister().catch(() => {});
        });
      })
      .catch(() => {});

    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => {
          keys.forEach((key) => {
            caches.delete(key).catch(() => {});
          });
        })
        .catch(() => {});
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
