import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Initialize Firestore with custom database ID from config
const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
export const db: Firestore = getFirestore(app, dbId);
