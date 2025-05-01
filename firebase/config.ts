import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

console.log("[FIREBASE] Starting Firebase initialization (Auth only)");

// Create the Firebase configuration object
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log("[FIREBASE] Config created with Auth services");

// Initialize Firebase App
let app;
try {
  if (getApps().length === 0) {
    console.log("[FIREBASE] No existing Firebase app, initializing new one");
    app = initializeApp(firebaseConfig);
    console.log("[FIREBASE] New Firebase app initialized");
  } else {
    console.log("[FIREBASE] Using existing Firebase app");
    app = getApp();
  }
} catch (error) {
  console.error("[FIREBASE] Error initializing Firebase app:", error);
  throw new Error(
    "Failed to initialize Firebase app: " + (error as Error).message
  );
}

// Initialize Firebase Auth
console.log("[FIREBASE] Initializing Auth service");
const auth = getAuth(app);

console.log("[FIREBASE] Firebase Auth initialized successfully");

// Export only the Authentication service
export { app, auth };
