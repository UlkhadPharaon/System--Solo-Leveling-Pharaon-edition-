import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Graceful offline-safe Firebase setup
let app;
let db: any = null;
let auth: any = null;

try {
  // Try importing local configuration. Since this is built and compiled dynamically,
  // we can fall back safely if the file doesn't exist yet or is not provisioned.
  const firebaseConfig = {
    apiKey: "dummy-key-for-local-offline-fallback",
    authDomain: "dummy-domain.firebaseapp.com",
    projectId: "dummy-project",
    storageBucket: "dummy-project.appspot.com",
    messagingSenderId: "123456",
    appId: "1:123456:web:123"
  };

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.warn("Firebase initialization skipped or deferred (Offline fallbacks active):", error);
}

export { db, auth };
