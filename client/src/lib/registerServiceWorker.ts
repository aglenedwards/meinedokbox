/**
 * Service Worker registration and management
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export async function registerServiceWorker(config: ServiceWorkerConfig = {}) {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported in this browser');
    return null;
  }

  if (import.meta.env.DEV) {
    console.log('Service Worker registration skipped in development mode');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/'
    });

    console.log('Service Worker registered successfully:', registration.scope);

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('New Service Worker available');
          config.onUpdate?.(registration);
        } else if (newWorker.state === 'activated') {
          console.log('Service Worker activated');
          config.onSuccess?.(registration);
        }
      });
    });

    window.addEventListener('online', () => {
      console.log('App is online');
      config.onOnline?.();
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
      config.onOffline?.();
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export async function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('Service Worker unregistered');
    return true;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
}

export function skipWaiting() {
  navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });
}

export function clearCache() {
  navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export async function checkForUpdates(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return false;
  }
}
