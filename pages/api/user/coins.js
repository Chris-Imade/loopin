import { connectToDatabase } from "../../../lib/mongodb";
import { verifyIdToken } from "../../../lib/auth-helpers";

/**
 * Handler for user coins API
 * GET - Retrieves user's current coin balance
 * POST - Adds coins to user's balance
 */
export default async function handler(req, res) {
  try {
    // Verify authorization token
    const token = req.headers.authorization?.split("Bearer ")[1];
    const tokenData = token ? await verifyIdToken(token) : null;

    // For development: allow requests without token
    const isDev = process.env.NODE_ENV === "development";
    if (!tokenData && !isDev) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");

    // Get the userId from the request
    const userId = req.query.userId || req.body?.userId || tokenData?.uid;

    if (!userId) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    // Retrieve user's coin data (GET)
    if (req.method === "GET") {
      const user = await usersCollection.findOne({ uid: userId });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Default to 0 if coins field doesn't exist
      return res.status(200).json({
        coins: user.coins || 0,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Add coins to user's balance (POST)
    else if (req.method === "POST") {
      const { amount } = req.body;

      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "Invalid coin amount" });
      }

      // First get current balance to calculate new total
      const user = await usersCollection.findOne({ uid: userId });
      const currentCoins = user?.coins || 0;
      const newTotal = currentCoins + amount;

      // Update user document
      const result = await usersCollection.updateOne(
        { uid: userId },
        {
          $inc: { coins: amount },
          $set: { updatedAt: new Date() },
        },
        { upsert: true }
      );

      if (result.modifiedCount === 0 && result.upsertedCount === 0) {
        return res.status(500).json({ error: "Failed to update coin balance" });
      }

      return res.status(200).json({
        success: true,
        newTotal: newTotal,
        added: amount,
        lastUpdated: new Date().toISOString(),
      });
    }

    // Handle spending coins (PUT)
    else if (req.method === "PUT") {
      const { amount } = req.body;

      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "Invalid coin amount" });
      }

      // Get current balance
      const user = await usersCollection.findOne({ uid: userId });
      const currentCoins = user?.coins || 0;

      // Check if user has enough coins
      if (currentCoins < amount) {
        return res.status(400).json({ error: "Insufficient coins" });
      }

      const newTotal = currentCoins - amount;

      // Update user document
      const result = await usersCollection.updateOne(
        { uid: userId },
        {
          $inc: { coins: -amount },
          $set: { updatedAt: new Date() },
        }
      );

      if (result.modifiedCount === 0) {
        return res.status(500).json({ error: "Failed to update coin balance" });
      }

      return res.status(200).json({
        success: true,
        newTotal: newTotal,
        spent: amount,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in coins API:", error);
    return res
      .status(500)
      .json({ error: "Server error", message: error.message });
  }
}
