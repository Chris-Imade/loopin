import { connectToDatabase, getDocumentByField } from "../mongodb";
import { ObjectId } from "mongodb";

// Collection name for users
const COLLECTION = "users";

/**
 * Create a new user document in MongoDB
 *
 * @param {Object} firebaseUser - The Firebase user object
 * @returns {Promise<Object>} Created user document
 */
export async function createUserDocument(firebaseUser) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    // Check if user already exists
    const existingUser = await getDocumentByField(
      collection,
      "uid",
      firebaseUser.uid
    );

    if (existingUser) {
      // User already exists, return existing document
      return existingUser;
    }

    // Create new user document
    const userDoc = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || "",
      photoURL: firebaseUser.photoURL || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSeen: new Date(),
      isOnline: true,
      subscription: "free", // Default subscription level
      contacts: [], // Empty contacts list
      appSettings: {
        darkMode: true,
        notifications: true,
        // Add other app settings here
      },
    };

    const result = await collection.insertOne(userDoc);
    return { ...userDoc, _id: result.insertedId };
  } catch (error) {
    console.error("[USER MODEL] Error creating user document:", error);
    throw error;
  }
}

/**
 * Get a user document by Firebase UID
 *
 * @param {string} uid - Firebase UID
 * @returns {Promise<Object|null>} User document or null if not found
 */
export async function getUserByFirebaseUID(uid) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION);
    return await getDocumentByField(collection, "uid", uid);
  } catch (error) {
    console.error("[USER MODEL] Error getting user by UID:", error);
    return null;
  }
}

/**
 * Update user's online status and last seen time
 *
 * @param {string} uid - Firebase UID
 * @param {boolean} isOnline - Online status
 * @returns {Promise<boolean>} Success status
 */
export async function updateUserStatus(uid, isOnline) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    const result = await collection.updateOne(
      { uid },
      {
        $set: {
          isOnline,
          lastSeen: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error("[USER MODEL] Error updating user status:", error);
    return false;
  }
}

/**
 * Add a contact to user's contact list
 *
 * @param {string} uid - Firebase UID of user
 * @param {string} contactUid - Firebase UID of contact to add
 * @returns {Promise<boolean>} Success status
 */
export async function addUserContact(uid, contactUid) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    // Make sure contact exists
    const contactUser = await getDocumentByField(collection, "uid", contactUid);
    if (!contactUser) {
      return false;
    }

    // Add to contacts array if not already there
    const result = await collection.updateOne(
      { uid },
      {
        $addToSet: {
          contacts: contactUid,
        },
        $set: {
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error("[USER MODEL] Error adding contact:", error);
    return false;
  }
}

/**
 * Update user profile
 *
 * @param {string} uid - Firebase UID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object|null>} Updated user or null on failure
 */
export async function updateUserProfile(uid, profileData) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    // Remove any sensitive or immutable fields
    const sanitizedData = { ...profileData };
    delete sanitizedData._id;
    delete sanitizedData.uid;
    delete sanitizedData.email; // Email should only be updated through Firebase Auth
    delete sanitizedData.createdAt;

    sanitizedData.updatedAt = new Date();

    const result = await collection.findOneAndUpdate(
      { uid },
      { $set: sanitizedData },
      { returnDocument: "after" }
    );

    return result.value;
  } catch (error) {
    console.error("[USER MODEL] Error updating profile:", error);
    return null;
  }
}

/**
 * Update user subscription status
 *
 * @param {string} uid - Firebase UID
 * @param {string} subscription - Subscription level (free, premium, etc.)
 * @returns {Promise<boolean>} Success status
 */
export async function updateUserSubscription(uid, subscription) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(COLLECTION);

    const result = await collection.updateOne(
      { uid },
      {
        $set: {
          subscription,
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error("[USER MODEL] Error updating subscription:", error);
    return false;
  }
}
