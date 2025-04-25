import { initializeApp, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Validate required environment variables
const validateEnvVariables = () => {
  const requiredVars = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    // Use fallback values in development
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `Missing environment variables: ${missingVars.join(
          ", "
        )}. Using fallback values.`
      );
      return false;
    }

    console.error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
    throw new Error(
      `Missing required Firebase configuration. Check your environment variables.`
    );
  }

  return true;
};

// Fallback config for development only
const fallbackConfig = {
  apiKey: "demo-key-for-development",
  authDomain: "demo-app.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456",
};

const areEnvVarsValid = validateEnvVariables();

const firebaseConfig = areEnvVarsValid
  ? {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
  : fallbackConfig;

// Initialize Firebase safely
let app;
try {
  app = getApp();
} catch (error) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (initError) {
    console.error("Failed to initialize Firebase:", initError);
    // Create a mock app object if Firebase fails to initialize
    // This allows the app to at least render without crashing
    if (process.env.NODE_ENV !== "production") {
      console.warn("Using mock Firebase instance for development");
      app = {} as any;
    } else {
      throw initError;
    }
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Initialize subscription listener with proper error handling
export const initializeSubscriptionListener = (
  userId: string,
  onSubscriptionUpdate: (status: string) => void
): (() => void) => {
  try {
    return onSnapshot(
      doc(db, "users", userId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (data?.subscriptionStatus) {
            onSubscriptionUpdate(data.subscriptionStatus);
          }
        }
      },
      (error) => {
        console.error("Error in subscription listener:", error);
        // Return a graceful error to the callback rather than crashing
        if (
          error.code === "unavailable" ||
          error.message?.includes("offline")
        ) {
          onSubscriptionUpdate("offline");
        }
      }
    );
  } catch (error) {
    console.error("Failed to initialize subscription listener:", error);
    // Return a no-op unsubscribe function
    return () => {};
  }
};
