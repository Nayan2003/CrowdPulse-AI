import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// ==========================================
// 🔥 FIREBASE CONFIGURATION
// ==========================================
// TODO: Replace this object with the one from your Firebase Console
// 1. Go to console.firebase.google.com
// 2. Create a project > Add Web App
// 3. Copy the firebaseConfig and paste it here
const firebaseConfig = {
  apiKey: "AIzaSyDcyNbwFv453bDI0mm4DREmon5MqBCsJeY",
  authDomain: "crowdpulse-ai-f3de5.firebaseapp.com",
  databaseURL: "https://crowdpulse-ai-f3de5-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "crowdpulse-ai-f3de5",
  storageBucket: "crowdpulse-ai-f3de5.firebasestorage.app",
  messagingSenderId: "937336493344",
  appId: "1:937336493344:web:07920adbc85ddbe61ab345",
  measurementId: "G-LHWL2Z9DZZ"
};

let app;
let db;
let isFirebaseConfigured = false;

if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
  try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    isFirebaseConfigured = true;
    console.log("🔥 Firebase initialized successfully!");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("⚠️ Firebase is not configured. The app will run in local simulation mode.");
}

export { db, isFirebaseConfigured, ref, onValue, set };
