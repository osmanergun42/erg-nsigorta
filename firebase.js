// js/firebase.js

// Firebase SDK modülleri
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Senin config verilerin
const firebaseConfig = {
  apiKey: "AIzaSyCKMnSGDPXyEYm31gV_FkwV7hcmLDJh1ik",
  authDomain: "politasis.firebaseapp.com",
  projectId: "politasis",
  storageBucket: "politasis.appspot.com",
  messagingSenderId: "283092133464",
  appId: "1:283092133464:web:436b276ae08290c923cc2d"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
