// DEPRECATED: This file uses Firestore which has been removed from the project.
// These are mock implementations that will be replaced with MongoDB equivalents.

import {
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";

// Mock Firestore db
const mockDb = {
  collection: (collectionName: string) => {
    console.warn(
      `[DEPRECATED] Firestore collection "${collectionName}" accessed. Use MongoDB instead.`
    );
    return {
      doc: (docId: string) => {
        console.warn(
          `[DEPRECATED] Firestore document "${docId}" accessed. Use MongoDB instead.`
        );
        return {};
      },
    };
  },
};

/**
 * DEPRECATED: Helper function to safely get a document with retry logic
 * Use MongoDB equivalents instead
 */
export async function safeGetDoc(
  docRef: DocumentReference
): Promise<DocumentSnapshot | null> {
  console.warn(
    "[DEPRECATED] safeGetDoc is deprecated. Use MongoDB equivalents."
  );
  return null;
}

/**
 * DEPRECATED: Helper function to safely update a document with retry logic
 * Use MongoDB equivalents instead
 */
export async function safeUpdateDoc(
  docRef: DocumentReference,
  data: any
): Promise<boolean> {
  console.warn(
    "[DEPRECATED] safeUpdateDoc is deprecated. Use MongoDB equivalents."
  );
  return false;
}

/**
 * DEPRECATED: Helper function to safely run a query with retry logic
 * Use MongoDB equivalents instead
 */
export async function safeGetDocs(
  queryRef: any
): Promise<QuerySnapshot<DocumentData> | null> {
  console.warn(
    "[DEPRECATED] safeGetDocs is deprecated. Use MongoDB equivalents."
  );
  return null;
}

/**
 * DEPRECATED: Helper function to get user data with error handling
 * Use MongoDB equivalents instead
 */
export async function getUserData(userId: string): Promise<any | null> {
  console.warn(
    "[DEPRECATED] getUserData is deprecated. Use MongoDB equivalents."
  );
  return null;
}

/**
 * DEPRECATED: Helper function to update user data with error handling
 * Use MongoDB equivalents instead
 */
export async function updateUserData(
  userId: string,
  data: any
): Promise<boolean> {
  console.warn(
    "[DEPRECATED] updateUserData is deprecated. Use MongoDB equivalents."
  );
  return false;
}

// Export a mock db for backward compatibility
export const db = mockDb;
