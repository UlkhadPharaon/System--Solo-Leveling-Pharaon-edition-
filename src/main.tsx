import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Register Service Worker for PWA + Web Push. The module resolves with the
// ServiceWorkerRegistration so pushNotifications.ts can call pushManager.subscribe()
// on it. Non-supporting environments simply resolve null (push stays disabled).
const swReadyPromise: Promise<ServiceWorkerRegistration | null> =
  'serviceWorker' in navigator
    ? new Promise((resolve) => {
        window.addEventListener('load', () => {
          navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
              console.log('SW registered: ', registration);
              // Check for updates when the page becomes visible again.
              document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                  registration.update().catch(() => {});
                }
              });
              // Re-claim control when a newer SW activates.
              navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('SW updated — reloading to apply new version.');
                window.location.reload();
              });
              resolve(registration);
            })
            .catch((registrationError) => {
              console.log('SW registration failed: ', registrationError);
              resolve(null);
            });
        });
      })
    : Promise.resolve(null);

export { swReadyPromise };

// ── Budget-GPU relief (index.css .anim-paused) ──────────────────────────────
// Pause decorative infinite animations while the tab is hidden: background
// glow/float/pulse loops otherwise keep the compositor awake and drain
// battery on phones sitting in a background tab.
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('anim-paused', document.visibilityState === 'hidden');
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);