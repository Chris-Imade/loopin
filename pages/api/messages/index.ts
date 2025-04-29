import { NextApiRequest, NextApiResponse } from "next";
import { verifyIdToken } from "../../../lib/auth-helpers";
import {
  sendMessage,
  getConversationMessages,
  createConversation,
} from "../../../lib/models/message";

/**
 * API handler for messages
 *
 * GET - Get messages for a conversation with pagination
 * POST - Send a new message to a conversation
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify authorization
  const token = req.headers.authorization?.split("Bearer ")[1];
  let userId;

  try {
    if (token) {
      const tokenData = await verifyIdToken(token);
      userId = tokenData.uid;
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Invalid token" });
  }

  // Handle GET request - retrieve messages
  if (req.method === "GET") {
    try {
      const { conversationId, limit, before } = req.query;

      if (!conversationId) {
        return res.status(400).json({ error: "Missing conversation ID" });
      }

      const messages = await getConversationMessages(
        conversationId as string,
        userId,
        limit ? parseInt(limit as string, 10) : 20,
        (before as string) || null
      );

      return res.status(200).json({ messages });
    } catch (error) {
      console.error("Error getting messages:", error);
      return res.status(500).json({ error: "Failed to get messages" });
    }
  }

  // Handle POST request - send message
  else if (req.method === "POST") {
    try {
      const { conversationId, recipientId, text, media } = req.body;

      // Validate required fields
      if (!text) {
        return res.status(400).json({ error: "Message text is required" });
      }

      // For new conversations, we need the recipient ID
      if (!conversationId && !recipientId) {
        return res.status(400).json({
          error: "Either conversationId or recipientId is required",
        });
      }

      let actualConversationId = conversationId;

      // If no conversation ID is provided, create a new conversation
      if (!actualConversationId && recipientId) {
        const conversation = await createConversation(userId, recipientId);
        if (!conversation) {
          return res.status(500).json({
            error: "Failed to create conversation",
          });
        }
        actualConversationId = conversation._id.toString();
      }

      // Send the message
      const message = await sendMessage(
        actualConversationId,
        userId,
        text,
        media || null
      );

      if (!message) {
        return res.status(500).json({ error: "Failed to send message" });
      }

      return res.status(201).json({
        message,
        conversationId: actualConversationId,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      return res.status(500).json({
        error: "Failed to send message",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Handle unsupported methods
  else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
