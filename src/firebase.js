import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDwffsBWXE9Gfj8gNLMYyjLdjzyX_8PgUY",
  authDomain: "roadsos-e95f5.firebaseapp.com",
  projectId: "roadsos-e95f5",
  storageBucket: "roadsos-e95f5.firebasestorage.app",
  messagingSenderId: "891087478163",
  appId: "1:891087478163:web:48b25eea1255d22c3a9c66"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);