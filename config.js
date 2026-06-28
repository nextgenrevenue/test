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

// গ্লোবাল ভেরিয়েবলগুলো সরাসরি window অবজেক্টে সেট করুন
window.firebaseReady = false;
window.firebaseInitAttempted = false;

function initializeFirebase() {
  if (window.firebaseInitAttempted) return window.firebaseReady;
  window.firebaseInitAttempted = true;
  
  try {
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK not loaded yet');
      window.firebaseInitAttempted = false; // আবার চেষ্টা করার সুযোগ দিন
      return false;
    }
    
    if (!firebase.apps || firebase.apps.length === 0) {
      window.firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      window.firebaseApp = firebase.apps[0];
    }
    
    // Firestore ও Analytics কে সরাসরি window-তে সেট করুন
    window.db = firebase.firestore();
    
    if (typeof firebase.analytics === 'function') {
      window.analytics = firebase.analytics();
    }

    window.firebaseReady = true;
    console.log("✅ Firebase initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    window.firebaseReady = false;
    return false;
  }
}