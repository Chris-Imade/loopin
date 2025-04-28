import { admin } from "../../lib/firebaseAdmin";
import { emitEvent } from "../../server/socket";

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
    // Get message from request or use default
    const { message = "Test message from socket API" } = req.body;
    const messageId = `test-${Date.now()}`;

    // Emit event to the specific user
    const eventEmitted = emitEvent(`test-${uid}`, {
      id: messageId,
      message,
      timestamp: new Date().toISOString(),
      uid,
    });

    // Return result
    return res.status(200).json({
      success: eventEmitted,
      details: {
        messageId,
        eventName: `test-${uid}`,
        message,
        timestamp: new Date().toISOString(),
        status: eventEmitted ? "sent" : "failed",
      },
    });
  } catch (error) {
    console.error("Socket test error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to emit socket event",
      message: error.message,
      details: {
        timestamp: new Date().toISOString(),
        errorName: error.name,
      },
    });
  }
}
