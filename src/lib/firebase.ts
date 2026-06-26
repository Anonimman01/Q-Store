import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "enduring-grammar-l8gvj",
  appId: "1:809889784576:web:bd6f4f1c34eaad926dc9e5",
  apiKey: "AIzaSyAGL2sAFQAsXjyj44DvFHWYNNMKCWOudOo",
  authDomain: "enduring-grammar-l8gvj.firebaseapp.com",
  storageBucket: "enduring-grammar-l8gvj.firebasestorage.app",
  messagingSenderId: "809889784576",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-inventorytracker-87e5e818-df94-48b7-b048-ee98b323b596");
