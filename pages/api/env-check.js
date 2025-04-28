import { connectToDatabase } from "../../lib/mongodb";
import admin from "firebase-admin";
import { v2 as cloudinary } from "cloudinary";

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
  } catch (error) {
    console.error("Firebase admin initialization error:", error);
  }
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * API endpoint to check environment variables and connections
 */
export default async function handler(req, res) {
  // Only GET requests allowed
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);

    const systemStatus = {
      firebase: { status: "unknown", message: "" },
      mongodb: { status: "unknown", message: "" },
      cloudinary: { status: "unknown", message: "" },
      agora: { status: "unknown", message: "" },
      environment: { status: "unknown", message: "", variables: {} },
    };

    // Check Firebase connection
    try {
      await admin.database().ref(".info/connected").once("value");
      systemStatus.firebase = {
        status: "connected",
        message: "Firebase Realtime Database is connected",
      };
    } catch (error) {
      systemStatus.firebase = {
        status: "error",
        message: `Firebase connection error: ${error.message}`,
      };
    }

    // Check MongoDB connection
    try {
      const { db } = await connectToDatabase();
      const collections = await db.listCollections().toArray();
      systemStatus.mongodb = {
        status: "connected",
        message: `MongoDB is connected. Available collections: ${collections.length}`,
        collections: collections.map((c) => c.name),
      };
    } catch (error) {
      systemStatus.mongodb = {
        status: "error",
        message: `MongoDB connection error: ${error.message}`,
      };
    }

    // Check Cloudinary connection
    try {
      const result = await cloudinary.api.ping();
      systemStatus.cloudinary = {
        status: "connected",
        message: "Cloudinary API is accessible",
      };
    } catch (error) {
      systemStatus.cloudinary = {
        status: "error",
        message: `Cloudinary connection error: ${error.message}`,
      };
    }

    // Check Agora configuration
    if (process.env.NEXT_PUBLIC_AGORA_APP_ID) {
      systemStatus.agora = {
        status: "configured",
        message: "Agora App ID is set",
      };
    } else {
      systemStatus.agora = {
        status: "error",
        message: "Agora App ID is missing",
      };
    }

    // Check environment variables
    const serverEnvVars = [
      "MONGODB_URI",
      "MONGODB_DB",
      "FIREBASE_CLIENT_EMAIL",
      "FIREBASE_PRIVATE_KEY",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ];

    const clientEnvVars = [
      "NEXT_PUBLIC_FIREBASE_API_KEY",
      "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      "NEXT_PUBLIC_FIREBASE_APP_ID",
      "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
      "NEXT_PUBLIC_AGORA_APP_ID",
      "NEXT_PUBLIC_APP_URL",
    ];

    const missingVars = [];

    // Check server-side variables
    serverEnvVars.forEach((varName) => {
      const isPresent = !!process.env[varName];
      systemStatus.environment.variables[varName] = isPresent
        ? "set"
        : "missing";

      if (!isPresent) {
        missingVars.push(varName);
      }
    });

    // Check client-side variables
    clientEnvVars.forEach((varName) => {
      const isPresent = !!process.env[varName];
      systemStatus.environment.variables[varName] = isPresent
        ? "set"
        : "missing";

      if (!isPresent) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length === 0) {
      systemStatus.environment.status = "ok";
      systemStatus.environment.message =
        "All required environment variables are set";
    } else {
      systemStatus.environment.status = "warning";
      systemStatus.environment.message = `Missing environment variables: ${missingVars.join(
        ", "
      )}`;
    }

    // Return complete system status
    return res.status(200).json(systemStatus);
  } catch (error) {
    console.error("Error checking system health:", error);
    return res.status(500).json({ error: error.message });
  }
}
