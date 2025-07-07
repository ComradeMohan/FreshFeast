self.importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
self.importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

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
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
