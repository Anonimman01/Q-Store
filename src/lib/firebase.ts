import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBXqTlWO3g_bn6npn93-lYr-l5opYITH_A",
  authDomain: "studio-418801116-746e1.firebaseapp.com",
  projectId: "studio-418801116-746e1",
  storageBucket: "studio-418801116-746e1.firebasestorage.app",
  messagingSenderId: "417311943436",
  appId: "1:417311943436:web:21195f70c79a47a87ef729",
  measurementId: "G-W9WQ2R8SMD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
