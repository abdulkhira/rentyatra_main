import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCTybWX-zsRixTgZ9q6rabPJZr9srY9S9g",
  authDomain: "rentyatra-1e42a.firebaseapp.com",
  projectId: "rentyatra-1e42a",
  storageBucket: "rentyatra-1e42a.firebasestorage.app",
  messagingSenderId: "901085016313",
  appId: "1:901085016313:web:3cfbd9d8c46c732494f228",
  measurementId: "G-00QWLKBH8W",
};

const app = initializeApp(firebaseConfig);

let messaging = null;

// ✅ SAFE INIT
const initMessaging = async () => {
  try {
    const supported = await isSupported();

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname.startsWith("192.168");

    const isWebView = /wv|WebView/i.test(navigator.userAgent);

    if (supported && !isLocal && !isWebView) {
      messaging = getMessaging(app);
      console.log("✅ Firebase messaging initialized");
    } else {
      console.log("⚠️ Firebase messaging skipped (unsupported env)");
    }
  } catch (e) {
    console.log("❌ Firebase messaging error:", e);
  }
};

// call it
initMessaging();

export { messaging, getToken, onMessage };