import { MongoClient } from "mongodb";
import { admin } from "../../lib/firebaseAdmin";

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

    // Create MongoDB client
    const client = new MongoClient(process.env.MONGODB_URI);

    // Test connection
    const startTime = Date.now();
    await client.connect();

    // Perform simple query to test database response
    const db = client.db(process.env.MONGODB_DB);
    const testCollection = db.collection("system_test");

    // Insert a test document
    const testDocument = {
      testId: `test-${Date.now()}`,
      userId: uid,
      timestamp: new Date(),
      message: "MongoDB connection test",
    };

    const insertResult = await testCollection.insertOne(testDocument);

    // Delete the test document
    await testCollection.deleteOne({ _id: insertResult.insertedId });

    // Close connection
    await client.close();

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Return success response
    return res.status(200).json({
      success: true,
      details: {
        responseTime: `${responseTime}ms`,
        connected: true,
        insertedId: insertResult.insertedId.toString(),
        databaseName: process.env.MONGODB_DB,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("MongoDB test error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to connect to MongoDB",
      details: {
        timestamp: new Date().toISOString(),
        errorCode: error.code,
        errorName: error.name,
      },
    });
  }
}
