import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyC_b21wRYQNFmDYvOcAlcMmbqvRU1kAjVo",
  authDomain: "liga-afas-a554c.firebaseapp.com",
  projectId: "liga-afas-a554c",
  storageBucket: "liga-afas-a554c.firebasestorage.app",
  messagingSenderId: "264727553284",
  appId: "1:264727553284:web:35dbcfe9a67e7db6c01c51"
};

// Initialize Firebase only if not already initialized
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

// Firebase Cloud Messaging - only initialize if supported
let messaging: Messaging | null = null;

export async function initMessaging(): Promise<Messaging | null> {
  try {
    if (messaging) return messaging;
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
    }
    return messaging;
  } catch {
    // Messaging not supported on this device/browser
    return null;
  }
}

export { getToken, onMessage };
export default app;
