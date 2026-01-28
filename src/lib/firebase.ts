import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC_b21wRYQNFMdYVvOcAlcMmbqvRU1kAjVo",
  authDomain: "liga-afas-a554c.firebaseapp.com",
  projectId: "liga-afas-a554c",
  storageBucket: "liga-afas-a554c.appspot.com",
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
export default app;
