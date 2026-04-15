// socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  const SOCKET_SERVER_URL =
    import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:3000";

  if (!socket) {
    // console.log("Creating new socket connection...");

    socket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
    });
  }

  return socket;
};