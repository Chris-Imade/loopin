import { connectToDatabase } from "../mongodb";
import { ObjectId } from "mongodb";

// Collection name for messages
const COLLECTION = "messages";
const CONVERSATIONS_COLLECTION = "conversations";

/**
 * Create a new conversation between users
 *
 * @param {string} user1Id - First user's Firebase UID
 * @param {string} user2Id - Second user's Firebase UID
 * @returns {Promise<Object|null>} Created conversation document or null on failure
 */
export async function createConversation(user1Id, user2Id) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(CONVERSATIONS_COLLECTION);

    // Check if conversation already exists
    const existingConversation = await collection.findOne({
      participants: { $all: [user1Id, user2Id] },
    });

    if (existingConversation) {
      return existingConversation;
    }

    // Create new conversation
    const conversation = {
      participants: [user1Id, user2Id],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
      unreadCounts: {
        [user1Id]: 0,
        [user2Id]: 0,
      },
    };

    const result = await collection.insertOne(conversation);
    return { ...conversation, _id: result.insertedId };
  } catch (error) {
    console.error("[MESSAGE MODEL] Error creating conversation:", error);
    return null;
  }
}

/**
 * Get all conversations for a user
 *
 * @param {string} userId - User's Firebase UID
 * @returns {Promise<Array>} Array of conversation documents
 */
export async function getUserConversations(userId) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(CONVERSATIONS_COLLECTION);

    return await collection
      .find({ participants: userId })
      .sort({ updatedAt: -1 })
      .toArray();
  } catch (error) {
    console.error("[MESSAGE MODEL] Error getting user conversations:", error);
    return [];
  }
}

/**
 * Send a message in a conversation
 *
 * @param {string} conversationId - Conversation ID
 * @param {string} senderId - Sender's Firebase UID
 * @param {string} text - Message text content
 * @param {Object} media - Optional media attachment (URL and type)
 * @returns {Promise<Object|null>} Created message or null on failure
 */
export async function sendMessage(
  conversationId,
  senderId,
  text,
  media = null
) {
  try {
    const { db } = await connectToDatabase();
    const messagesCollection = db.collection(COLLECTION);
    const conversationsCollection = db.collection(CONVERSATIONS_COLLECTION);

    // Get the conversation to verify sender is a participant
    const conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
    });

    if (!conversation || !conversation.participants.includes(senderId)) {
      throw new Error(
        "User not authorized to send message in this conversation"
      );
    }

    // Create the message
    const message = {
      conversationId: new ObjectId(conversationId),
      senderId,
      text,
      media,
      createdAt: new Date(),
      readBy: [senderId], // Sender has read the message
    };

    const result = await messagesCollection.insertOne(message);

    // Update the conversation with last message and increment unread count for recipient
    const recipient = conversation.participants.find((id) => id !== senderId);

    // Build update for unread counts
    const unreadUpdate = {};
    unreadUpdate[`unreadCounts.${recipient}`] = 1; // Increment by 1

    await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      {
        $set: {
          lastMessage: {
            text: text.substring(0, 50), // Store preview of message
            senderId,
            createdAt: new Date(),
          },
          updatedAt: new Date(),
        },
        $inc: unreadUpdate,
      }
    );

    return { ...message, _id: result.insertedId };
  } catch (error) {
    console.error("[MESSAGE MODEL] Error sending message:", error);
    return null;
  }
}

/**
 * Get messages for a conversation with pagination
 *
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID (for authorization)
 * @param {number} limit - Number of messages to return
 * @param {string} before - Get messages before this message ID (for pagination)
 * @returns {Promise<Array>} Array of message documents
 */
export async function getConversationMessages(
  conversationId,
  userId,
  limit = 20,
  before = null
) {
  try {
    const { db } = await connectToDatabase();
    const messagesCollection = db.collection(COLLECTION);
    const conversationsCollection = db.collection(CONVERSATIONS_COLLECTION);

    // Verify user is a participant in the conversation
    const conversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
      participants: userId,
    });

    if (!conversation) {
      throw new Error("User not authorized to access this conversation");
    }

    // Build query
    let query = { conversationId: new ObjectId(conversationId) };

    // If we're paginating, add the before condition
    if (before) {
      query._id = { $lt: new ObjectId(before) };
    }

    // Get messages
    const messages = await messagesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Mark messages as read
    await messagesCollection.updateMany(
      {
        conversationId: new ObjectId(conversationId),
        senderId: { $ne: userId }, // Not sent by current user
        readBy: { $ne: userId }, // Not already read by current user
      },
      { $addToSet: { readBy: userId } }
    );

    // Reset unread count for user
    const unreadUpdate = {};
    unreadUpdate[`unreadCounts.${userId}`] = 0;

    await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      { $set: unreadUpdate }
    );

    return messages;
  } catch (error) {
    console.error(
      "[MESSAGE MODEL] Error getting conversation messages:",
      error
    );
    return [];
  }
}
