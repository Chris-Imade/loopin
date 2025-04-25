import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";

console.log("[FIREBASE] Starting Firebase initialization");

// Step 1: Print all environment variables for debugging (safely)
console.log("[FIREBASE] Environment variables check:", {
  NODE_ENV: process.env.NODE_ENV,
  hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  hasStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  hasMessagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  hasDatabaseURL: !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
});

// Step 2: Create the Firebase configuration object
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

console.log("[FIREBASE] Config created:", {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? "[HIDDEN]" : undefined,
});

// Step 3: Initialize Firebase App
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

// Step 4: Initialize Firebase services
console.log("[FIREBASE] Initializing Auth service");
const auth = getAuth(app);

console.log("[FIREBASE] Initializing Firestore service");
const db = getFirestore(app);

console.log("[FIREBASE] Initializing Storage service");
const storage = getStorage(app);

console.log("[FIREBASE] Initializing Functions service");
const functions = getFunctions(app);

// Step 5: Initialize Realtime Database with error handling
let rtdb;
try {
  console.log("[FIREBASE] Initializing Realtime Database service");
  if (!firebaseConfig.databaseURL) {
    throw new Error("Database URL is missing in configuration");
  }
  rtdb = getDatabase(app);

  // Verify if we're in development mode to use emulator
  if (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true"
  ) {
    connectDatabaseEmulator(rtdb, "localhost", 9000);
    console.log("[FIREBASE] Connected to Realtime Database emulator");
  }

  console.log(
    "[FIREBASE] Realtime Database initialized with URL:",
    firebaseConfig.databaseURL
  );
} catch (error) {
  console.error("[FIREBASE] Error initializing Realtime Database:", error);
  // Create a mock database object to prevent app crashes
  rtdb = {
    ref: () => ({
      on: () => {},
      off: () => {},
      once: () => Promise.resolve({ val: () => null }),
    }),
    app: app,
  } as any;
}

console.log("[FIREBASE] All Firebase services initialized successfully");

// Export the Firebase services
export { app, auth, db, storage, functions, rtdb };
