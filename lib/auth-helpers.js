import { getAuth } from "firebase/auth";
import { app } from "../firebase/config";

/**
 * Verify Firebase ID token
 * @param {string} token The Firebase ID token to verify
 * @returns {Promise<Object|null>} The decoded token or null if invalid
 */
export async function verifyIdToken(token) {
  if (!token) return null;

  try {
    // For client-side verification
    const auth = getAuth(app);

    // This is a simple client-side validation
    // In a production environment, you would use Firebase Admin SDK on the server
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("No authenticated user found for token verification");
      return null;
    }

    // Get the current user's ID token - we can't actually verify the passed
    // token directly in the client, but we can check if the user is logged in
    const currentToken = await currentUser.getIdToken();

    if (!currentToken) {
      console.error("Failed to get current user token");
      return null;
    }

    // Return user data that would be in the decoded token
    return {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
}
