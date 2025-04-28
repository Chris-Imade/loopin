import { admin } from "../../lib/firebaseAdmin";
import { createAgoraToken } from "../../lib/agora-token";

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // Verify token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // Check if Agora is configured
    if (!process.env.NEXT_PUBLIC_AGORA_APP_ID) {
      return res.status(500).json({
        success: false,
        error: "Agora App ID is not configured",
        details: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Create a test token
    const channelName = `test-${Date.now()}`;
    const role = "publisher";
    const expireTime = 3600; // 1 hour

    let tokenGenerated = false;
    let tokenValue = null;
    let errorDetails = null;

    try {
      // Attempt to generate a token
      tokenValue = createAgoraToken(channelName, uid, role, expireTime);
      tokenGenerated = true;
    } catch (tokenError) {
      errorDetails = {
        message: tokenError.message,
        stack:
          process.env.NODE_ENV === "development" ? tokenError.stack : undefined,
      };
    }

    // Return results
    return res.status(200).json({
      success: tokenGenerated,
      details: {
        appId: process.env.NEXT_PUBLIC_AGORA_APP_ID ? "configured" : "missing",
        channelName: channelName,
        tokenGenerated: tokenGenerated,
        tokenExpiry: tokenGenerated ? `${expireTime} seconds` : null,
        timestamp: new Date().toISOString(),
        error: errorDetails,
      },
    });
  } catch (error) {
    console.error("Agora test error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to test Agora connectivity",
      details: {
        timestamp: new Date().toISOString(),
        errorCode: error.code,
        errorName: error.name,
      },
    });
  }
}
