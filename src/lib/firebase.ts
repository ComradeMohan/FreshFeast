import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, collection, onSnapshot, setDoc, deleteDoc, increment } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAy4JPapi5_URS2E6aGEGjJwaBWgeR8fxA",
  authDomain: "freshfeastweb.firebaseapp.com",
  projectId: "freshfeastweb",
  storageBucket: "freshfeastweb.appspot.com",
  messagingSenderId: "56960232198",
  appId: "1:56960232198:web:e5735e4da0dff9ce68cc87",
  measurementId: "G-WKDLXJ0WQF"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export const requestNotificationPermission = async (userId: string) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  
  try {
    const messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
    if (!vapidKey) {
      console.error("VAPID key not found. Please add NEXT_PUBLIC_FCM_VAPID_KEY to your .env.local file.");
      return null;
    }

    const currentToken = await getToken(messaging, { vapidKey });
    if (!currentToken) {
      return null;
    }
    
    const userDocRef = doc(db, 'users', userId);
    const agentDocRef = doc(db, 'deliveryAgents', userId);

    const userDocSnap = await getDoc(userDocRef);
    const agentDocSnap = await getDoc(agentDocRef);

    if (userDocSnap.exists()) {
      await updateDoc(userDocRef, { fcmToken: currentToken });
    } else if (agentDocSnap.exists()) {
      await updateDoc(agentDocRef, { fcmToken: currentToken });
    } else {
      return null; 
    }

    return currentToken;
  } catch (error) {
    console.error('An error occurred while retrieving token or saving it.', error);
    return null;
  }
};


export { app, auth, db, storage, signOut };
