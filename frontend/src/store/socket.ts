// socket.ts
import { io, Socket } from "socket.io-client";

let socket:Socket;

export const getSocket = () => {
  if (!socket) {
     const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:8000";
    console.log("Connecting socket to:", SOCKET_SERVER_URL);
    
      socket = io(SOCKET_SERVER_URL,{
         transports: ["websocket"],
      });
  }
  return socket;
};