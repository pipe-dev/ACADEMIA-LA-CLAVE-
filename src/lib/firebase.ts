import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

// Reemplaza esto con tu configuración real de Firebase
// Lo encuentras en Configuración del Proyecto > General > Tus aplicaciones > SDK de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "TU_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "TU_PROYECTO.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "TU_PROYECTO",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "TU_PROYECTO.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "TU_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "TU_APP_ID"
};

// Inicializar Firebase (solo en el cliente)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicializar Messaging (solo si estamos en el navegador y soporta Service Workers)
let messaging: Messaging | null = null;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  messaging = getMessaging(app);
}

// Reemplaza esto con tu llave VAPID real
// La encuentras en Configuración del Proyecto > Cloud Messaging > Certificados Web Push
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "TU_VAPID_KEY_AQUI";

/**
 * Solicita permisos y obtiene el Token de FCM.
 * Además, asigna un Lote aleatorio del 1 al 600 para el "Goteo Extremo".
 */
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      throw new Error("La mensajería no está soportada en este entorno.");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Permiso denegado por el usuario.");
    }

    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY
    });

    if (currentToken) {
      // Asignar un lote aleatorio entre 1 y 600 para la estrategia anti-caídas
      const randomLote = Math.floor(Math.random() * 600) + 1;
      
      console.log("Token FCM generado:", currentToken);
      console.log("Asignado al Lote:", randomLote);

      // Registrar el token y el lote en el servidor seguro de Next.js
      // para que suscriba al usuario al Topic correspondiente
      try {
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: currentToken, lote: randomLote }),
        });
        console.log("Suscripción al lote completada en el backend.");
      } catch (err) {
        console.error("Fallo al suscribir en backend:", err);
      }
      
      return { token: currentToken, lote: randomLote };
    } else {
      throw new Error("No se pudo obtener el token de registro.");
    }
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    throw error;
  }
};

/**
 * Escucha los mensajes cuando la App está abierta (en primer plano).
 */
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    }
  });

export { app, messaging };
