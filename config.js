// ==================== GLOBAL FIREBASE CONFIGURATION ====================
const firebaseConfig = {
  apiKey: "AIzaSyCUGkcHFSYVmA0KUSRHhY-ZFFAS6jpJe4M",
  authDomain: "doctor-appointment-syste-23828.firebaseapp.com",
  projectId: "doctor-appointment-syste-23828",
  storageBucket: "doctor-appointment-syste-23828.appspot.com",
  messagingSenderId: "79600391014",
  appId: "1:79600391014:web:9688db8bb62f431ae16ea7",
  measurementId: "G-ESJFXWGT6J"
};

let firebaseApp;
let db;
let analytics;
let firebaseReady = false;
let firebaseInitAttempted = false;

// Firebase ইনিশিয়ালাইজ করার গ্লোবাল ফাংশন
function initializeFirebase() {
  if (firebaseInitAttempted) return firebaseReady;
  firebaseInitAttempted = true;
  
  try {
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK not loaded yet');
      return false;
    }
    
    if (!firebase.apps || firebase.apps.length === 0) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
      console.log("✅ Firebase initialized successfully");
    } else {
      firebaseApp = firebase.apps[0];
      console.log("✅ Firebase already initialized");
    }
    
    // Firestore ও Analytics সচল করা
    db = firebase.firestore();
    
    if (typeof firebase.analytics === 'function') {
      analytics = firebase.analytics();
      console.log("📊 Firebase Analytics initialized");
    }

    firebaseReady = true;
    return true;
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    firebaseReady = false;
    return false;
  }
}