import admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:
          process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
    console.log("[FIREBASE ADMIN] Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error(
      "[FIREBASE ADMIN] Firebase Admin initialization error:",
      error
    );
  }
}

export { admin };
