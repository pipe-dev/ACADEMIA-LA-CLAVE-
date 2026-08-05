importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBF0eB3kVqVPmRElom8jiGyGuJk-LwZ4ao",
  authDomain: "afinapp-2026.firebaseapp.com",
  projectId: "afinapp-2026",
  storageBucket: "afinapp-2026.firebasestorage.app",
  messagingSenderId: "554000626213",
  appId: "1:554000626213:web:df00e9e8633ab91a6e45cc"
};

// Inicializar la app de Firebase en el Service Worker
firebase.initializeApp(firebaseConfig);

// Inicializar Firebase Cloud Messaging
const messaging = firebase.messaging();

// Manejador para recibir notificaciones en segundo plano (cuando la app está cerrada)
messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Mensaje recibido en segundo plano ',
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
