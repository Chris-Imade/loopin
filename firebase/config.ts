import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  getFirestore,
  enableIndexedDbPersistence,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  CACHE_SIZE_UNLIMITED,
  FirestoreSettings,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { doc, onSnapshot } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// For debugging only
console.log("API Key Available:", !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log(
  "API Key Prefix:",
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 8)
);

// Initialize Firebase safely
let app;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
  // Create a mock app object if Firebase fails to initialize
  // This allows the app to at least render without crashing
  if (process.env.NODE_ENV !== "production") {
    console.warn("Using mock Firebase instance for development");
    app = {} as any;
  } else {
    throw error;
  }
}

// Initialize Firebase services
const auth = getAuth(app);

// Create custom settings to fix WebChannelConnection issues
const customSettings: FirestoreSettings = {
  ignoreUndefinedProperties: true,
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  experimentalAutoDetectLongPolling: true,
  experimentalForceLongPolling: true,
};

// Try to initialize with custom settings, fall back to default if already initialized
let db;
try {
  db = initializeFirestore(app, customSettings);
  console.log("Firestore initialized with custom settings");
} catch (error) {
  console.warn("Using existing Firestore instance:", error);
  db = getFirestore(app);
}

const storage = getStorage(app);
const functions = getFunctions(app);

// Connection status monitoring and retry logic
if (typeof window !== "undefined") {
  // Set up connection retry mechanism
  const MAX_RETRY_ATTEMPTS = 5;
  let currentRetry = 0;
  let connectionTimeout: any = null;

  const retryConnection = () => {
    if (currentRetry >= MAX_RETRY_ATTEMPTS) {
      console.error(
        `Failed to establish reliable Firestore connection after ${MAX_RETRY_ATTEMPTS} attempts`
      );
      return;
    }

    // Clear previous timeout
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }

    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, currentRetry), 30000);
    console.log(
      `Scheduling Firestore reconnection attempt in ${delay}ms (attempt ${
        currentRetry + 1
      }/${MAX_RETRY_ATTEMPTS})`
    );

    connectionTimeout = setTimeout(() => {
      console.log(
        `Attempting to reconnect to Firestore (attempt ${
          currentRetry + 1
        }/${MAX_RETRY_ATTEMPTS})`
      );

      // Ping Firestore with a harmless query
      try {
        const pingRef = doc(db, "_ping", "ping");
        const unsubscribe = onSnapshot(
          pingRef,
          () => {
            console.log("Firestore connection re-established");
            unsubscribe();
          },
          (error) => {
            console.warn("Firestore reconnection failed:", error.message);
            currentRetry++;
            unsubscribe();
            retryConnection();
          }
        );
      } catch (error) {
        console.error("Error during reconnection attempt:", error);
        currentRetry++;
        retryConnection();
      }
    }, delay);
  };

  // Listen for online/offline events
  window.addEventListener("online", () => {
    console.log("Browser is online, attempting to reconnect to Firestore");
    currentRetry = 0; // Reset retry counter when we go online
    retryConnection();
  });

  window.addEventListener("offline", () => {
    console.log("Browser is offline, pausing Firestore connection attempts");
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }
  });

  // Initial connection attempt if already online
  if (navigator.onLine) {
    retryConnection();
  }
}

// Connect to emulators in development
if (
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_EMULATORS === "true"
) {
  try {
    connectFirestoreEmulator(db, "localhost", 8080);
    connectAuthEmulator(auth, "http://localhost:9099");
    connectStorageEmulator(storage, "localhost", 9199);
    connectFunctionsEmulator(functions, "localhost", 5001);
    console.log("Connected to Firebase emulators");
  } catch (e) {
    console.error("Error connecting to emulators:", e);
  }
}

// Initialize subscription listener with proper error handling
export const initializeSubscriptionListener = (
  userId: string,
  onSubscriptionUpdate: (status: string) => void
): (() => void) => {
  if (!db || !userId) {
    console.error(
      "Cannot initialize subscription listener: missing db or userId"
    );
    return () => {};
  }

  let retryCount = 0;
  const maxRetries = 3;

  const setupListener = () => {
    try {
      const docRef = doc(db, "users", userId);
      return onSnapshot(
        docRef,
        { includeMetadataChanges: true }, // Include metadata to track connection state
        (docSnapshot) => {
          // Check if this is from cache or server
          const source = docSnapshot.metadata.fromCache
            ? "local cache"
            : "server";
          console.log(`Data retrieved from ${source}`);

          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            if (data?.subscriptionStatus) {
              onSubscriptionUpdate(data.subscriptionStatus);
            }
          }
        },
        (error) => {
          console.error(
            `Error in subscription listener (attempt ${retryCount + 1}):`,
            error
          );

          // Retry logic for connection issues
          if (
            retryCount < maxRetries &&
            (error.code === "unavailable" ||
              error.message?.includes("offline") ||
              error.message?.includes("transport errored") ||
              error.message?.includes("WebChannelConnection"))
          ) {
            retryCount++;
            const retryDelay = retryCount * 3000; // Increase delay with each retry
            console.log(
              `Retrying subscription listener in ${
                retryDelay / 1000
              } seconds...`
            );
            setTimeout(setupListener, retryDelay);
          } else {
            // Too many retries or an error we don't know how to handle
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

  return setupListener();
};

export { app, auth, db, storage, functions };
