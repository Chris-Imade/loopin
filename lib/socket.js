import { io } from "socket.io-client";

// Cache the socket instance
let socketInstance = null;

/**
 * Initialize and get the Socket.io client instance
 * @returns {Socket} Socket.io client instance
 */
export function getSocket() {
  if (typeof window === "undefined") {
    return null; // Only run on client
  }

  if (!socketInstance) {
    console.log(
      "[SOCKET] Initializing with URL:",
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000"
    );

    // Check if we're in development mode (localhost)
    const isDevelopment =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    // Use local socket URL if in development
    const socketUrl = isDevelopment
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_SOCKET_URL;

    try {
      // Initialize new socket connection with proper CORS settings
      socketInstance = io(socketUrl, {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 30000, // Increase timeout to 30s
        transports: ["websocket", "polling"],
        withCredentials: true, // Important for cookies if needed
        extraHeaders: {
          "Access-Control-Allow-Origin": window.location.origin,
        },
      });

      // Set up logging
      socketInstance.on("connect", () => {
        console.log("[SOCKET] Connected to server:", socketUrl);
      });

      socketInstance.on("disconnect", (reason) => {
        console.log(`[SOCKET] Disconnected: ${reason}`);
      });

      socketInstance.on("connect_error", (error) => {
        console.error("[SOCKET] Connection error:", error);
        // Fallback to a mock socket in development if connection fails
        if (isDevelopment) {
          console.log("[SOCKET] Using mock socket in development mode");
          initMockSocket();
        }
      });

      socketInstance.on("error", (error) => {
        console.error("[SOCKET] Error event:", error);
        if (isDevelopment) {
          initMockSocket();
        }
      });

      socketInstance.on("connect_timeout", (timeout) => {
        console.error("[SOCKET] Connection timeout after", timeout);
        if (isDevelopment) {
          initMockSocket();
        }
      });
    } catch (error) {
      console.error("[SOCKET] Error creating socket:", error);
      if (isDevelopment) {
        initMockSocket();
      }
    }
  }

  // Always return a socket - will be mock in development if real one fails
  return socketInstance || initMockSocket();
}

/**
 * Initialize a mock socket that simulates events in development
 * when the real socket server isn't available
 */
function initMockSocket() {
  if (socketInstance && socketInstance._isMock) {
    return socketInstance; // Already using mock socket
  }

  console.log("[SOCKET] Creating mock socket instance");

  // Simple event system to simulate socket.io
  const events = {};

  // Create a mock socket that doesn't try to connect to server
  socketInstance = {
    _isMock: true,
    connected: true,
    auth: {},
    emit: (event, data) => {
      console.log(`[MOCK SOCKET] Emit: ${event}`, data);
      // If this is a join event, trigger a fake response
      if (event === "join-conversation") {
        setTimeout(() => {
          const handlers = events[`new-message-${data.conversationId}`] || [];
          handlers.forEach((handler) =>
            handler({
              id: "mock-msg-" + Date.now(),
              text: "This is a mock message in development mode",
              timestamp: new Date(),
              senderId: "mock-user",
            })
          );
        }, 1000);
      }

      // If this is a status update, notify listeners
      if (event === "update-status") {
        setTimeout(() => {
          const handlers = events["user-status-change"] || [];
          handlers.forEach((handler) =>
            handler({
              userId: "mock-user",
              isOnline: data.isOnline,
              lastSeen: new Date(),
            })
          );
        }, 500);
      }
    },
    on: (event, handler) => {
      console.log(`[MOCK SOCKET] Register handler for: ${event}`);
      if (!events[event]) events[event] = [];
      events[event].push(handler);
      return socketInstance; // For chaining
    },
    off: (event, handler) => {
      if (!events[event]) return socketInstance;
      events[event] = events[event].filter((h) => h !== handler);
      return socketInstance; // For chaining
    },
    connect: () => {
      console.log("[MOCK SOCKET] Connect called");
      setTimeout(() => {
        const connectHandlers = events["connect"] || [];
        connectHandlers.forEach((handler) => handler());
      }, 100);
      return socketInstance;
    },
    disconnect: () => {
      console.log("[MOCK SOCKET] Disconnect called");
      setTimeout(() => {
        const disconnectHandlers = events["disconnect"] || [];
        disconnectHandlers.forEach((handler) => handler("mock disconnect"));
      }, 100);
      return socketInstance;
    },
  };

  return socketInstance;
}

/**
 * Connect to the Socket.io server with authentication token
 * @param {string} token - Firebase auth token for authentication
 */
export function connectSocket(token) {
  if (typeof window === "undefined") return;

  const socket = getSocket();
  if (!socket) return;

  // Add auth token to socket handshake query
  socket.auth = { token };

  // Connect if not already connected
  if (!socket.connected) {
    socket.connect();
  }
}

/**
 * Disconnect the Socket.io client
 */
export function disconnectSocket() {
  if (typeof window === "undefined") return;

  const socket = getSocket();
  if (socket?.connected) {
    socket.disconnect();
  }
}

/**
 * Subscribe to user presence/status updates
 * @param {Function} callback - Function to call when a user's status changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToUserStatus(callback) {
  if (typeof window === "undefined") return () => {};

  const socket = getSocket();
  if (!socket) return () => {};

  // Listen for status changes
  socket.on("user-status-change", callback);

  // Return unsubscribe function
  return () => {
    socket.off("user-status-change", callback);
  };
}

/**
 * Subscribe to new messages in a conversation
 * @param {string} conversationId - Conversation ID to listen to
 * @param {Function} callback - Function to call when a new message arrives
 * @returns {Function} Unsubscribe function
 */
export function subscribeToConversation(conversationId, callback) {
  if (typeof window === "undefined") return () => {};

  const socket = getSocket();
  if (!socket) return () => {};

  // Join the conversation room
  socket.emit("join-conversation", { conversationId });

  // Listen for new messages in this conversation
  const eventName = `new-message-${conversationId}`;
  socket.on(eventName, callback);

  // Return unsubscribe function
  return () => {
    socket.emit("leave-conversation", { conversationId });
    socket.off(eventName, callback);
  };
}

/**
 * Update user's online status
 * @param {boolean} isOnline - Whether the user is online
 */
export function updateUserOnlineStatus(isOnline) {
  if (typeof window === "undefined") return;

  const socket = getSocket();
  if (!socket?.connected) return;

  socket.emit("update-status", { isOnline });
}
