const { Server } = require("socket.io");
const admin = require("firebase-admin");
const { connectToDatabase } = require("../lib/mongodb");
const { updateUserStatus } = require("../lib/models/user");

let io;

/**
 * Initialize Socket.io server
 * @param {Object} server - HTTP server instance
 */
function initializeSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: Token missing"));
      }

      // Verify Firebase token
      const decodedToken = await admin.auth().verifyIdToken(token);
      if (!decodedToken) {
        return next(new Error("Authentication error: Invalid token"));
      }

      // Store user data in socket
      socket.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };

      next();
    } catch (error) {
      console.error("[SOCKET] Auth error:", error);
      next(new Error("Authentication error"));
    }
  });

  // Connection handler
  io.on("connection", handleSocketConnection);

  console.log("[SOCKET] Socket.io server initialized");
  return io;
}

/**
 * Handle new socket connections
 * @param {Socket} socket - Socket.io socket instance
 */
async function handleSocketConnection(socket) {
  const userId = socket.user.uid;
  console.log(`[SOCKET] User connected: ${userId}`);

  // Update user's online status in MongoDB
  try {
    await updateUserStatus(userId, true);

    // Notify other users about status change
    socket.broadcast.emit("user-status-change", {
      uid: userId,
      isOnline: true,
      lastSeen: new Date(),
    });
  } catch (error) {
    console.error("[SOCKET] Error updating user status:", error);
  }

  // Handle ping/pong for testing
  socket.on("ping", async (data) => {
    console.log(`[SOCKET] Ping received from ${userId}:`, data);

    // Send a pong back to the client
    socket.emit("pong", {
      message: "Pong! Your ping was received",
      timestamp: new Date().toISOString(),
      receivedData: data,
    });
  });

  // Handle status updates
  socket.on("update-status", async ({ isOnline }) => {
    try {
      await updateUserStatus(userId, isOnline);

      // Notify other users about status change
      socket.broadcast.emit("user-status-change", {
        uid: userId,
        isOnline,
        lastSeen: new Date(),
      });
    } catch (error) {
      console.error("[SOCKET] Error updating user status:", error);
    }
  });

  // Handle conversation subscriptions
  socket.on("join-conversation", ({ conversationId }) => {
    if (!conversationId) return;

    console.log(
      `[SOCKET] User ${userId} joined conversation: ${conversationId}`
    );
    socket.join(`conversation:${conversationId}`);
  });

  socket.on("leave-conversation", ({ conversationId }) => {
    if (!conversationId) return;

    console.log(`[SOCKET] User ${userId} left conversation: ${conversationId}`);
    socket.leave(`conversation:${conversationId}`);
  });

  // Handle disconnection
  socket.on("disconnect", async (reason) => {
    console.log(`[SOCKET] User disconnected: ${userId}, reason: ${reason}`);

    // Update user's status to offline in MongoDB
    try {
      await updateUserStatus(userId, false);

      // Notify other users about status change
      socket.broadcast.emit("user-status-change", {
        uid: userId,
        isOnline: false,
        lastSeen: new Date(),
      });
    } catch (error) {
      console.error(
        "[SOCKET] Error updating user status on disconnect:",
        error
      );
    }
  });
}

/**
 * Emit a new message event to conversation participants
 * @param {string} conversationId - Conversation ID
 * @param {Object} message - Message object
 */
function emitNewMessage(conversationId, message) {
  if (!io) {
    console.warn("[SOCKET] Socket server not initialized");
    return;
  }

  io.to(`conversation:${conversationId}`).emit(
    `new-message-${conversationId}`,
    message
  );
}

/**
 * Emit a custom event to a specific room or globally
 * @param {string} eventName - Event name
 * @param {Object} data - Event data
 * @param {string} [room] - Optional room name (if not provided, emits globally)
 */
function emitEvent(eventName, data, room = null) {
  if (!io) {
    console.warn("[SOCKET] Socket server not initialized");
    return false;
  }

  try {
    if (room) {
      // Emit to a specific room
      io.to(room).emit(eventName, data);
    } else {
      // Emit globally
      io.emit(eventName, data);
    }

    console.log(
      `[SOCKET] Emitted '${eventName}' event${
        room ? ` to room ${room}` : " globally"
      }`
    );
    return true;
  } catch (error) {
    console.error(`[SOCKET] Error emitting '${eventName}' event:`, error);
    return false;
  }
}

module.exports = {
  initializeSocketServer,
  emitNewMessage,
  emitEvent,
};
