import {
  updateUserProfile,
  getUserByFirebaseUID,
} from "../../../lib/models/user";
import admin from "firebase-admin";
import { v2 as cloudinary } from "cloudinary";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
    }),
  });
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * API endpoint for user profile operations
 */
export default async function handler(req, res) {
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

  // Handle GET request - get user profile
  if (req.method === "GET") {
    try {
      const user = await getUserByFirebaseUID(uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json({ user });
    } catch (error) {
      console.error("Error getting user profile:", error);
      return res
        .status(500)
        .json({ error: "Failed to get user profile", message: error.message });
    }
  }

  // Handle PUT request - update user profile
  if (req.method === "PUT") {
    try {
      const profileData = req.body;

      // Handle profile image upload if it's a base64 string
      if (
        profileData.photoURL &&
        profileData.photoURL.startsWith("data:image")
      ) {
        try {
          const uploadResult = await cloudinary.uploader.upload(
            profileData.photoURL,
            {
              folder: `users/${uid}`,
              public_id: "profile",
              overwrite: true,
              resource_type: "image",
            }
          );

          // Replace the base64 string with the Cloudinary URL
          profileData.photoURL = uploadResult.secure_url;
        } catch (cloudinaryError) {
          console.error("Cloudinary upload error:", cloudinaryError);
          // Continue with update but don't change profile picture
          delete profileData.photoURL;
        }
      }

      const updatedUser = await updateUserProfile(uid, profileData);

      if (!updatedUser) {
        return res
          .status(404)
          .json({ error: "User not found or update failed" });
      }

      return res.status(200).json({ user: updatedUser });
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).json({
        error: "Failed to update user profile",
        message: error.message,
      });
    }
  }

  // If not GET or PUT, return method not allowed
  return res.status(405).json({ error: "Method not allowed" });
}
