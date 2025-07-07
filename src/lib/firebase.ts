import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAy4JPapi5_URS2E6aGEGjJwaBWgeR8fxA",
  authDomain: "freshfeastweb.firebaseapp.com",
  projectId: "freshfeastweb",
  storageBucket: "freshfeastweb.appspot.com",
  messagingSenderId: "56960232198",
  appId: "1:56960232198:web:e5735e4da0dff9ce68cc87",
  measurementId: "G-WKDLXJ0WQF"
};

// Initialize Firebase
// Check if an app is already initialized to avoid errors during hot-reloading
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
