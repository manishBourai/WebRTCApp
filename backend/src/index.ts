import Express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

type UserItem = { id: string; name: string };
type SessionMode = "lobby" | "room";
type SocketMeta = { name: string; roomId: string | null; mode: SessionMode };

const app = Express();
const server = createServer(app);
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",").map((origin) => origin.trim()).filter(Boolean)
);
const originAllowed = (origin?: string) => typeof origin === "string" && allowedOrigins.has(origin);
const io = new Server(server, {
  cors: { origin: (origin, callback) => callback(originAllowed(origin) ? null : new Error("Origin not allowed"), originAllowed(origin)) },
  allowRequest: (request, callback) => callback(null, originAllowed(request.headers.origin)),
  maxHttpBufferSize: 100_000,
  pingTimeout: 20_000,
});

const socketMeta = new Map<string, SocketMeta>();
const rooms = new Map<string, UserItem[]>();
const pendingCalls = new Map<string, string>(); // callee -> caller
const pendingCallTimers = new Map<string, ReturnType<typeof setTimeout>>();
const activeCalls = new Map<string, string>(); // each peer -> the other peer
const rateWindows = new Map<string, { startedAt: number; count: number }>();
const roomKeyPattern = /^[a-f0-9]{32}$/;
const roomChannel = (roomId: string) => `room:${roomId}`;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const safeName = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0 && value.trim().length <= 40;

const emitLobbyUsers = () => {
  const users: UserItem[] = [];
  socketMeta.forEach((meta, id) => { if (meta.mode === "lobby") users.push({ id, name: meta.name }); });
  io.emit("allUser", users);
};

const emitRoomUpdate = (roomId: string) => {
  const users = rooms.get(roomId) ?? [];
  io.to(roomChannel(roomId)).emit("roomUpdate", { roomId, users, isFull: users.length >= 2 });
};

const endCall = (socketId: string) => {
  const peerId = activeCalls.get(socketId);
  if (!peerId) return;
  activeCalls.delete(socketId);
  activeCalls.delete(peerId);
  io.to(peerId).emit("endCall");
  io.to(socketId).emit("endCall");
};

const cancelPendingCall = (socketId: string) => {
  const caller = pendingCalls.get(socketId);
  if (caller) {
    pendingCalls.delete(socketId);
    clearTimeout(pendingCallTimers.get(socketId));
    pendingCallTimers.delete(socketId);
    io.to(caller).emit("callDeclined");
  }
  for (const [callee, pendingCaller] of pendingCalls) {
    if (pendingCaller === socketId) {
      pendingCalls.delete(callee);
      clearTimeout(pendingCallTimers.get(callee));
      pendingCallTimers.delete(callee);
      io.to(callee).emit("callDeclined");
    }
  }
};

const leaveCurrentRoom = (socket: Socket) => {
  const currentMeta = socketMeta.get(socket.id);
  const currentRoomId = currentMeta?.roomId;
  if (!currentRoomId) return;
  cancelPendingCall(socket.id);
  endCall(socket.id);
  const updatedUsers = (rooms.get(currentRoomId) ?? []).filter((user) => user.id !== socket.id);
  socket.leave(roomChannel(currentRoomId));
  if (updatedUsers.length === 0) rooms.delete(currentRoomId);
  else {
    rooms.set(currentRoomId, updatedUsers);
    emitRoomUpdate(currentRoomId);
  }
  if (currentMeta) socketMeta.set(socket.id, { ...currentMeta, roomId: null });
};

const getPeerInRoom = (socket: Socket) => {
  const roomId = socketMeta.get(socket.id)?.roomId;
  if (!roomId) return null;
  return (rooms.get(roomId) ?? []).find((user) => user.id !== socket.id) ?? null;
};

const validDescription = (value: unknown, type: "offer" | "answer") => {
  if (!value || typeof value !== "object") return false;
  const description = value as { type?: unknown; sdp?: unknown };
  return description.type === type && typeof description.sdp === "string" && description.sdp.length > 0 && description.sdp.length <= 64_000;
};

app.get("/", (_req, res) => res.send("Welcome To WebRTC Backend"));

io.on("connection", (socket: Socket) => {
  socketMeta.set(socket.id, { name: "Guest", roomId: null, mode: "lobby" });

  socket.use(([event], next) => {
    const now = Date.now();
    const window = rateWindows.get(socket.id);
    if (!window || now - window.startedAt >= 10_000) rateWindows.set(socket.id, { startedAt: now, count: 1 });
    else if (window.count >= 40) return next(new Error("Rate limit exceeded"));
    else window.count += 1;
    next();
  });

  socket.on("setProfile", (data: unknown) => {
    if (!isRecord(data)) return socket.emit("roomError", "Enter a valid profile.");
    if (!safeName(data.name) || (data.mode !== "lobby" && data.mode !== "room")) return socket.emit("roomError", "Enter a valid name and session mode.");
    const current = socketMeta.get(socket.id);
    if (current?.roomId && data.mode !== "room") leaveCurrentRoom(socket);
    if (current?.mode !== data.mode) cancelPendingCall(socket.id);
    socketMeta.set(socket.id, { name: data.name.trim(), roomId: data.mode === "room" ? current?.roomId ?? null : null, mode: data.mode });
    if (data.mode === "lobby") emitLobbyUsers();
  });

  socket.on("joinLobby", () => {
    const current = socketMeta.get(socket.id);
    if (!current) return;
    cancelPendingCall(socket.id);
    leaveCurrentRoom(socket);
    socketMeta.set(socket.id, { ...current, roomId: null, mode: "lobby" });
    emitLobbyUsers();
  });

  socket.on("joinRoom", (data: unknown) => {
    if (!isRecord(data)) return socket.emit("roomError", "Enter a valid room code.");
    const current = socketMeta.get(socket.id);
    if (typeof data.roomId !== "string" || !roomKeyPattern.test(data.roomId)) return socket.emit("roomError", "Room code must be a 32-character secure invite code.");
    if (!current || current.mode !== "room") return socket.emit("roomError", "Set room mode before joining.");
    leaveCurrentRoom(socket);
    const users = rooms.get(data.roomId) ?? [];
    if (users.length >= 2 && !users.some((user) => user.id === socket.id)) return socket.emit("roomError", "This room already has 2 people.");
    rooms.set(data.roomId, [...users.filter((user) => user.id !== socket.id), { id: socket.id, name: current.name }]);
    socket.join(roomChannel(data.roomId));
    socketMeta.set(socket.id, { ...current, roomId: data.roomId });
    emitLobbyUsers();
    emitRoomUpdate(data.roomId);
  });

  socket.on("requestCall", (data: unknown) => {
    if (!isRecord(data)) return socket.emit("roomError", "Choose a valid person to call.");
    const sender = socketMeta.get(socket.id);
    if (typeof data.receiverId !== "string" || data.receiverId === socket.id || !sender) return socket.emit("roomError", "Choose a valid person to call.");
    const receiver = socketMeta.get(data.receiverId);
    const sameRoom = sender.mode === "room" && receiver?.mode === "room" && sender.roomId && sender.roomId === receiver.roomId && Boolean(getPeerInRoom(socket));
    const sameLobby = sender.mode === "lobby" && receiver?.mode === "lobby";
    if (!receiver || (!sameRoom && !sameLobby)) return socket.emit("roomError", "That person is not available for a call.");
    const involvedInPendingCall = [...pendingCalls].some(([calleeId, callerId]) => calleeId === socket.id || callerId === socket.id || calleeId === data.receiverId || callerId === data.receiverId);
    if (activeCalls.has(socket.id) || activeCalls.has(data.receiverId) || involvedInPendingCall) return socket.emit("roomError", "One of you is already in a call request or call.");
    pendingCalls.set(data.receiverId, socket.id);
    pendingCallTimers.set(data.receiverId, setTimeout(() => {
      const callerId = pendingCalls.get(data.receiverId as string);
      pendingCalls.delete(data.receiverId as string);
      pendingCallTimers.delete(data.receiverId as string);
      if (callerId) {
        io.to(callerId).emit("callDeclined");
        io.to(data.receiverId as string).emit("callDeclined");
      }
    }, 30_000));
    io.to(data.receiverId).emit("incomingCall", { from: socket.id, callerName: sender.name });
  });

  socket.on("acceptCall", (data: unknown) => {
    if (!isRecord(data)) return;
    if (typeof data.callerId !== "string" || pendingCalls.get(socket.id) !== data.callerId) return;
    const caller = socketMeta.get(data.callerId);
    const callee = socketMeta.get(socket.id);
    if (!caller || !callee) return;
    const sameMode = caller.mode === callee.mode;
    const sameRoom = caller.mode !== "room" || (caller.roomId && caller.roomId === callee.roomId);
    if (!sameMode || !sameRoom) {
      pendingCalls.delete(socket.id);
      clearTimeout(pendingCallTimers.get(socket.id));
      pendingCallTimers.delete(socket.id);
      return;
    }
    pendingCalls.delete(socket.id);
    clearTimeout(pendingCallTimers.get(socket.id));
    pendingCallTimers.delete(socket.id);
    activeCalls.set(socket.id, data.callerId);
    activeCalls.set(data.callerId, socket.id);
    io.to(data.callerId).emit("callAccepted", { peerId: socket.id, peerName: callee.name });
    socket.emit("callAccepted", { peerId: data.callerId, peerName: caller.name });
  });

  socket.on("declineCall", (data: unknown) => {
    if (!isRecord(data)) return;
    if (typeof data.callerId !== "string" || pendingCalls.get(socket.id) !== data.callerId) return;
    pendingCalls.delete(socket.id);
    clearTimeout(pendingCallTimers.get(socket.id));
    pendingCallTimers.delete(socket.id);
    io.to(data.callerId).emit("callDeclined");
  });

  socket.on("createOffer", (data: unknown) => {
    if (!isRecord(data)) return;
    const peerId = activeCalls.get(socket.id);
    if (!peerId || !validDescription(data.offer, "offer")) return;
    io.to(peerId).emit("offer", { offer: data.offer, from: socket.id, receiverName: socketMeta.get(socket.id)?.name });
  });

  socket.on("answer", (data: unknown) => {
    if (!isRecord(data)) return;
    const peerId = activeCalls.get(socket.id);
    if (!peerId || !validDescription(data.offer, "answer")) return;
    io.to(peerId).emit("answer", { offer: data.offer, from: socket.id });
  });

  socket.on("iceCandidate", (data: unknown) => {
    if (!isRecord(data)) return;
    const peerId = activeCalls.get(socket.id);
    const candidate = data?.candidate as { candidate?: unknown } | undefined;
    if (!peerId || !candidate || typeof candidate.candidate !== "string" || candidate.candidate.length > 4_096) return;
    io.to(peerId).emit("iceCandidate", { candidate: data.candidate, from: socket.id });
  });

  socket.on("cutCall", () => endCall(socket.id));
  socket.on("leaveRoom", () => { cancelPendingCall(socket.id); leaveCurrentRoom(socket); emitLobbyUsers(); });
  socket.on("disconnect", () => {
    cancelPendingCall(socket.id);
    endCall(socket.id);
    leaveCurrentRoom(socket);
    socketMeta.delete(socket.id);
    rateWindows.delete(socket.id);
    emitLobbyUsers();
  });
});

server.listen(Number(process.env.PORT) || 3000, () => console.log("Signaling server listening"));
