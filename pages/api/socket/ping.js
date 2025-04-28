import admin from "firebase-admin";
import { emitEvent } from "../../../server/socket";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:
          process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
      }),
    });
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
}

/**
 * API endpoint to handle socket ping/pong testing
 */
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify authentication
  let uid;
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ error: "Authorization header missing" });
    }

    const token = req.headers.authorization.split("Bearer ")[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    uid = decodedToken.uid;
  } catch (error) {
    console.error("Authentication error:", error);
    return res
      .status(401)
      .json({ error: "Unauthorized", message: error.message });
  }

  try {
    // Get message from request
    const { message = "ping" } = req.body;

    // Emit 'pong' event to the specific user
    emitEvent(`pong-${uid}`, {
      message: `Received: ${message}`,
      timestamp: new Date().toISOString(),
      uid,
    });

    // Return success
    return res.status(200).json({
      success: true,
      message: "Pong event emitted",
    });
  } catch (error) {
    console.error("Socket ping error:", error);
    return res.status(500).json({
      error: "Failed to emit event",
      message: error.message,
    });
  }
}
