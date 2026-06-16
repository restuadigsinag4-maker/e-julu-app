import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBgVPUwmlcd8jp6pz8bPnRciOy9reTNax4",
  authDomain: "e-julu.firebaseapp.com",
  projectId: "e-julu",
  storageBucket: "e-julu.firebasestorage.app",
  messagingSenderId: "805811702740",
  appId: "1:805811702740:web:242b1b59af34db850a2441"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);