import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const fallbackFirebaseConfig = {
  apiKey: 'AIzaSyCaWgJAr3320L5iOOvRMRMjEu6o3VOaTXs',
  authDomain: 'jeetwise-c6df5.firebaseapp.com',
  projectId: 'jeetwise-c6df5',
  storageBucket: 'jeetwise-c6df5.firebasestorage.app',
  messagingSenderId: '34687625931',
  appId: '1:34687625931:web:c30c82439dc1dac9af494e',
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackFirebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackFirebaseConfig.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackFirebaseConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    fallbackFirebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackFirebaseConfig.appId,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseConfigError =
  missingKeys.length > 0
    ? `Missing Firebase env vars: ${missingKeys.join(', ')}. Copy .env.example to .env and fill in your Firebase config.`
    : '';

const app = firebaseConfigError ? null : initializeApp(firebaseConfig);

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export async function ensureAnonymousSession() {
  if (firebaseConfigError || !auth) {
    throw new Error(firebaseConfigError || 'Firebase is not configured.');
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  const credential = await signInAnonymously(auth);
  return credential.user;
}
