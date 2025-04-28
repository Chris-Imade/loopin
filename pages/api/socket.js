import { Server as ServerIO } from "socket.io";
import { initializeSocketServer } from "../../server/socket";

// Custom implementation to handle Socket.io with Next.js
export default function SocketHandler(req, res) {
  // Check if Socket.io server is already initialized
  if (res.socket.server.io) {
    console.log("[SOCKET] Socket.io server already running");
    res.end();
    return;
  }

  // Initialize Socket.io server
  console.log("[SOCKET] Initializing Socket.io server...");
  const io = initializeSocketServer(res.socket.server);

  // Attach Socket.io server to Next.js server
  res.socket.server.io = io;
  console.log("[SOCKET] Socket.io server attached to Next.js server");

  res.end();
}

// Disable body parsing as it's not needed for WebSocket
export const config = {
  api: {
    bodyParser: false,
  },
};
