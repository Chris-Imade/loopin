import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  collection,
  DocumentReference,
  CollectionReference,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/config";

// Maximum number of retries for operations
const MAX_RETRIES = 3;
// Initial retry delay in milliseconds
const INITIAL_RETRY_DELAY = 1000;

/**
 * Helper function to safely get a document with retry logic
 */
export async function safeGetDoc(
  docRef: DocumentReference
): Promise<DocumentSnapshot | null> {
  let retries = 0;
  let delay = INITIAL_RETRY_DELAY;

  while (retries < MAX_RETRIES) {
    try {
      return await getDoc(docRef);
    } catch (error: any) {
      console.error(
        `Error getting document (attempt ${retries + 1}/${MAX_RETRIES}):`,
        error
      );

      // If we're offline or it's the last retry, return null instead of failing
      if (!navigator.onLine || retries === MAX_RETRIES - 1) {
        console.warn(
          "Using cached data or returning null due to connection issue"
        );
        return null;
      }

      // Exponential backoff
      retries++;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Double the delay for next retry
    }
  }

  return null;
}

/**
 * Helper function to safely update a document with retry logic
 */
export async function safeUpdateDoc(
  docRef: DocumentReference,
  data: any
): Promise<boolean> {
  let retries = 0;
  let delay = INITIAL_RETRY_DELAY;

  while (retries < MAX_RETRIES) {
    try {
      await updateDoc(docRef, data);
      return true;
    } catch (error: any) {
      console.error(
        `Error updating document (attempt ${retries + 1}/${MAX_RETRIES}):`,
        error
      );

      // If we're offline or it's the last retry, fail gracefully
      if (!navigator.onLine || retries === MAX_RETRIES - 1) {
        console.warn("Failed to update document due to connection issue");
        return false;
      }

      retries++;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  return false;
}

/**
 * Helper function to safely run a query with retry logic
 */
export async function safeGetDocs(
  queryRef: any
): Promise<QuerySnapshot<DocumentData> | null> {
  let retries = 0;
  let delay = INITIAL_RETRY_DELAY;

  while (retries < MAX_RETRIES) {
    try {
      return await getDocs(queryRef);
    } catch (error: any) {
      console.error(
        `Error querying documents (attempt ${retries + 1}/${MAX_RETRIES}):`,
        error
      );

      // If we're offline or it's the last retry, return null
      if (!navigator.onLine || retries === MAX_RETRIES - 1) {
        console.warn(
          "Using cached data or returning null due to connection issue"
        );
        return null;
      }

      retries++;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  return null;
}

/**
 * Helper function to get user data with error handling
 */
export async function getUserData(userId: string): Promise<any | null> {
  if (!userId) {
    console.error("Cannot get user data: userId is empty");
    return null;
  }

  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await safeGetDoc(docRef);

    if (docSnap && docSnap.exists()) {
      return docSnap.data();
    } else {
      console.warn(`User document not found for ID: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
}

/**
 * Helper function to update user data with error handling
 */
export async function updateUserData(
  userId: string,
  data: any
): Promise<boolean> {
  if (!userId) {
    console.error("Cannot update user data: userId is empty");
    return false;
  }

  if (!navigator.onLine) {
    console.warn("Cannot update user data while offline");
    return false;
  }

  try {
    const docRef = doc(db, "users", userId);
    return await safeUpdateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating user data:", error);
    return false;
  }
}
