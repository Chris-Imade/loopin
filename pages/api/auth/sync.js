import { auth } from "../../../firebase/config";
import {
  createUserDocument,
  getUserByFirebaseUID,
} from "../../../lib/models/user";
import admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

/**
 * API handler for syncing Firebase Auth users with MongoDB
 *
 * This endpoint can be called in two ways:
 * 1. With a Firebase ID token - for client-side requests
 * 2. With a user record - for server-side operations or webhooks
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let firebaseUser;

    // Check if request contains an ID token
    if (req.headers.authorization) {
      const token = req.headers.authorization.split("Bearer ")[1];
      if (!token) {
        return res.status(401).json({ error: "Invalid token format" });
      }

      // Verify the token
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Get the user from Firebase Auth
      firebaseUser = await admin.auth().getUser(decodedToken.uid);
    }
    // Or if it contains a direct user object (for server-side operations)
    else if (req.body.user) {
      firebaseUser = req.body.user;
    }
    // Neither was provided
    else {
      return res.status(400).json({ error: "No authentication provided" });
    }

    // Create or update the user document in MongoDB
    const userDoc = await createUserDocument(firebaseUser);

    // Return the MongoDB user document
    return res.status(200).json({ user: userDoc });
  } catch (error) {
    console.error("Error syncing user:", error);
    return res
      .status(500)
      .json({ error: "Failed to sync user", message: error.message });
  }
}
