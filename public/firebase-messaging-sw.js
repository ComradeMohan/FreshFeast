// This file needs to be in the public directory.
// It handles background notifications for Firebase Cloud Messaging.
// It is important that this file is served from the root of your domain.

self.importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
self.importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAy4JPapi5_URS2E6aGEGjJwaBWgeR8fxA",
  authDomain: "freshfeastweb.firebaseapp.com",
  projectId: "freshfeastweb",
  storageBucket: "freshfeastweb.appspot.com",
  messagingSenderId: "56960232198",
  appId: "1:56960232198:web:e5735e4da0dff9ce68cc87",
  measurementId: "G-WKDLXJ0WQF"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
