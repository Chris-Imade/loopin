import { rtdb } from "../firebase/config";
import { ref, get, child, serverTimestamp, set } from "firebase/database";

/**
 * Test function to verify Firebase Realtime Database connection
 * Call this function from a component useEffect for testing
 */
export const testRealtimeDatabase = async (): Promise<{
  success: boolean;
  message: string;
  error?: any;
}> => {
  console.log("[FIREBASE TEST] Testing Realtime Database connection...");

  try {
    // First check if rtdb is properly initialized
    if (!rtdb || typeof rtdb.ref !== "function") {
      return {
        success: false,
        message: "Realtime Database not properly initialized",
        error: new Error("Realtime Database not available"),
      };
    }

    // Try to read .info/connected node
    const connectedRef = ref(rtdb, ".info/connected");
    const connectedSnapshot = await get(connectedRef);
    console.log("[FIREBASE TEST] Connected status:", connectedSnapshot.val());

    // Try to write to a test node (this will fail if database rules don't allow it)
    try {
      const testRef = ref(rtdb, "connectivity-test");
      await set(testRef, {
        timestamp: serverTimestamp(),
        clientTime: new Date().toISOString(),
      });
      console.log("[FIREBASE TEST] Write test successful");
    } catch (writeError) {
      console.warn(
        "[FIREBASE TEST] Write test failed (may be due to permissions):",
        writeError
      );
      // Continue with the read test even if write fails
    }

    // Try to read the root reference
    const rootRef = ref(rtdb);
    const snapshot = await get(child(rootRef, "status"));

    return {
      success: true,
      message: "Database connection successful. Read test passed.",
    };
  } catch (error) {
    console.error("[FIREBASE TEST] Database connection test failed:", error);
    return {
      success: false,
      message: "Database connection test failed",
      error,
    };
  }
};

export default testRealtimeDatabase;
