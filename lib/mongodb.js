import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

/**
 * Connect to MongoDB and cache the connection
 * @returns {Promise<{client: MongoClient, db: any}>}
 */
export async function connectToDatabase() {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Check for MongoDB URI
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  // Connect to cluster
  try {
    console.log("[MONGODB] Connecting to database...");
    const client = new MongoClient(process.env.MONGODB_URI, options);
    await client.connect();

    const db = client.db(process.env.MONGODB_DB);

    // Cache the client and db connection
    cachedClient = client;
    cachedDb = db;

    console.log("[MONGODB] Successfully connected to database");
    return { client, db };
  } catch (error) {
    console.error("[MONGODB] Connection error:", error);
    throw error;
  }
}

/**
 * Get MongoDB document by ID with typecasting to ObjectId
 */
export function getDocumentById(collection, id) {
  const { ObjectId } = require("mongodb");
  try {
    return collection.findOne({ _id: new ObjectId(id) });
  } catch (error) {
    console.error("[MONGODB] Error fetching document by ID:", error);
    return null;
  }
}

/**
 * Get MongoDB document by field value
 */
export function getDocumentByField(collection, field, value) {
  const query = {};
  query[field] = value;
  return collection.findOne(query);
}
