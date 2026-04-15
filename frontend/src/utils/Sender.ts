import { create } from "zustand";

type UserItem = {
  id: string;
  name: string;
};

type RoomStatus = "idle" | "waiting" | "ready" | "full";
type SessionMode = "lobby" | "room";

type SenderStore = {
  name: string | null;
  mode: SessionMode | null;
  onlineUsers: UserItem[];
  roomId: string;
  roomUsers: UserItem[];
  receiver: string | null;
  receiverName: string | null;
  connect: boolean;
  roomStatus: RoomStatus;
  setName: (value: string) => void;
  setMode: (value: SessionMode | null) => void;
  setOnlineUsers: (value: UserItem[]) => void;
  setRoomId: (value: string) => void;
  setRoomUsers: (value: UserItem[]) => void;
  setReceiver: (value: string | null) => void;
  setReceiverName: (value: string | null) => void;
  setConnection: (value: boolean) => void;
  setRoomStatus: (value: RoomStatus) => void;
  resetSession: () => void;
};

const Sender = create<SenderStore>((set) => ({
  name: null,
  mode: null,
  onlineUsers: [],
  roomId: "",
  roomUsers: [],
  receiver: null,
  receiverName: null,
  connect: false,
  roomStatus: "idle",

  setName: (value) => set({ name: value }),
  setMode: (value) => set({ mode: value }),
  setOnlineUsers: (value) => set({ onlineUsers: value }),
  setRoomId: (value) => set({ roomId: value }),
  setRoomUsers: (value) => set({ roomUsers: value }),
  setReceiver: (value) => set({ receiver: value }),
  setReceiverName: (value) => set({ receiverName: value }),
  setConnection: (value) => set({ connect: value }),
  setRoomStatus: (value) => set({ roomStatus: value }),
  resetSession: () =>
    set({
      mode: null,
      onlineUsers: [],
      roomId: "",
      roomUsers: [],
      receiver: null,
      receiverName: null,
      connect: false,
      roomStatus: "idle",
    }),
}));

export default Sender;
