import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };
