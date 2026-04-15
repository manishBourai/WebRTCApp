import Express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

type UserItem = {
  id: string;
  name: string;
};

type SessionMode = "lobby" | "room";

type SocketMeta = {
  name: string;
  roomId: string | null;
  mode: SessionMode;
};

const app = Express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const socketMeta = new Map<string, SocketMeta>();
const rooms = new Map<string, UserItem[]>();

const normalizeRoomId = (roomId: string) => roomId.trim().toLowerCase();
const roomChannel = (roomId: string) => `room:${roomId}`;

const emitLobbyUsers = () => {
  const users: UserItem[] = [];

  socketMeta.forEach((meta, id) => {
    if (meta.mode === "lobby") {
      users.push({ id, name: meta.name });
    }
  });

  io.emit("allUser", users);
};

const emitRoomUpdate = (roomId: string) => {
  const users = rooms.get(roomId) ?? [];
  io.to(roomChannel(roomId)).emit("roomUpdate", {
    roomId,
    users,
    isFull: users.length >= 2,
  });
};

const leaveCurrentRoom = (socket: Socket) => {
  const currentMeta = socketMeta.get(socket.id);
  const currentRoomId = currentMeta?.roomId;

  if (!currentRoomId) {
    return;
  }

  const users = rooms.get(currentRoomId) ?? [];
  const updatedUsers = users.filter((user) => user.id !== socket.id);

  socket.leave(roomChannel(currentRoomId));

  if (updatedUsers.length === 0) {
    rooms.delete(currentRoomId);
  } else {
    rooms.set(currentRoomId, updatedUsers);
    emitRoomUpdate(currentRoomId);
    socket.to(roomChannel(currentRoomId)).emit("endCall");
  }

  if (currentMeta) {
    socketMeta.set(socket.id, {
      ...currentMeta,
      roomId: null,
    });
  }
};

const getPeerInRoom = (socket: Socket) => {
  const currentRoomId = socketMeta.get(socket.id)?.roomId;
  if (!currentRoomId) {
    return null;
  }

  const users = rooms.get(currentRoomId) ?? [];
  return users.find((user) => user.id !== socket.id) ?? null;
};

app.get("/", (_req, res) => {
  res.send("Welcome To WebRTC Backend");
});

io.on("connection", (socket: Socket) => {
  console.log("server is connected", socket.id);

  socketMeta.set(socket.id, {
    name: "Guest",
    roomId: null,
    mode: "lobby",
  });

  socket.on(
    "setProfile",
    ({ name, mode }: { name: string; mode?: SessionMode }) => {
      const currentMeta = socketMeta.get(socket.id);
      const nextMode = mode ?? currentMeta?.mode ?? "lobby";

      socketMeta.set(socket.id, {
        name: name?.trim() || "Guest",
        roomId: nextMode === "room" ? currentMeta?.roomId ?? null : null,
        mode: nextMode,
      });

      if (nextMode === "lobby") {
        leaveCurrentRoom(socket);
      }

      emitLobbyUsers();
    }
  );

  socket.on("joinLobby", () => {
    const currentMeta = socketMeta.get(socket.id);
    leaveCurrentRoom(socket);

    socketMeta.set(socket.id, {
      name: currentMeta?.name ?? "Guest",
      roomId: null,
      mode: "lobby",
    });

    emitLobbyUsers();
  });

  socket.on("joinRoom", ({ roomId }: { roomId: string }) => {
    const normalizedRoomId = normalizeRoomId(roomId);
    const currentMeta = socketMeta.get(socket.id);

    if (!normalizedRoomId || !currentMeta) {
      socket.emit("roomError", "Enter a valid room name.");
      return;
    }

    leaveCurrentRoom(socket);

    const users = rooms.get(normalizedRoomId) ?? [];
    const alreadyInRoom = users.some((user) => user.id === socket.id);

    if (!alreadyInRoom && users.length >= 2) {
      socket.emit("roomError", "This room already has 2 people.");
      return;
    }

    const nextUsers = alreadyInRoom
      ? users.map((user) =>
          user.id === socket.id ? { id: socket.id, name: currentMeta.name } : user
        )
      : [...users, { id: socket.id, name: currentMeta.name }];

    rooms.set(normalizedRoomId, nextUsers);
    socket.join(roomChannel(normalizedRoomId));
    socketMeta.set(socket.id, {
      name: currentMeta.name,
      roomId: normalizedRoomId,
      mode: "room",
    });

    emitLobbyUsers();
    emitRoomUpdate(normalizedRoomId);
  });

  socket.on("createOffer", (data) => {
    const currentMeta = socketMeta.get(socket.id);

    if (currentMeta?.mode === "room") {
      const peer = getPeerInRoom(socket);

      if (!peer || !currentMeta.roomId) {
        socket.emit("roomError", "Waiting for another user to join the room.");
        return;
      }

      io.to(peer.id).emit("offer", {
        offer: data.offer,
        from: socket.id,
        receiverName: currentMeta.name,
        mode: "room",
      });
      return;
    }

    if (!data.receiverId) {
      socket.emit("roomError", "Choose a user to call.");
      return;
    }

    io.to(data.receiverId).emit("offer", {
      offer: data.offer,
      from: socket.id,
      receiverName: currentMeta?.name ?? "Guest",
      mode: "lobby",
    });
  });

  socket.on("answer", (data) => {
    if (!data.receiverId) return;
    io.to(data.receiverId).emit("answer", { myId: socket.id, offer: data.offer });
  });

  socket.on("iceCandidate", (data) => {
    if (!data.receiverId) return;

    io.to(data.receiverId).emit("iceCandidate", {
      candidate: data.candidate,
      from: socket.id,
    });
  });

  socket.on("cutCall", (receiverId?: string) => {
    if (!receiverId) return;
    io.to(receiverId).emit("endCall");
  });

  socket.on("leaveRoom", () => {
    leaveCurrentRoom(socket);
    emitLobbyUsers();
  });

  socket.on("disconnect", () => {
    leaveCurrentRoom(socket);
    socketMeta.delete(socket.id);
    emitLobbyUsers();
    console.log("Disconnected", socket.id);
  });
});

server.listen(3000, () => {
  console.log("server is listen on 3000");
});
