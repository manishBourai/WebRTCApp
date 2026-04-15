import React, { useState } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { Button } from "./ui/button";

interface SidebarProps {
  user: string;
  mode: "lobby" | "room";
  roomId: string;
  roomUsers: { name: string; id: string }[];
  onlineUsers: { name: string; id: string }[];
  roomStatus: "idle" | "waiting" | "ready" | "full";
  selectedUserId: string | null;
  onSelectUser: (id: string, name: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  mode,
  roomId,
  roomUsers,
  onlineUsers,
  roomStatus,
  selectedUserId,
  onSelectUser,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Failed to copy room id:", error);
    }
  };

  const statusLabel =
    roomStatus === "ready"
      ? "Two people are in this room"
      : roomStatus === "full"
        ? "Room is full"
        : "Waiting for one more person";

  return (
    <aside className="w-full border-b border-white/15 bg-slate-950/75 backdrop-blur-xl lg:min-h-screen lg:w-[360px] lg:border-r lg:border-b-0">
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-4">
          <UserCircleIcon className="h-12 w-12 text-cyan-300" />
          <div>
            <p className="text-sm text-slate-400">You joined as</p>
            <h2 className="text-xl font-semibold text-white">{user}</h2>
          </div>
        </div>

        {mode === "room" ? (
          <>
            <div className="rounded-3xl border border-cyan-400/20 bg-slate-900/80 p-4 shadow-[0_20px_80px_rgba(6,182,212,0.12)]">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
                Room Name
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="break-all text-2xl font-semibold text-white">{roomId}</p>
                <Button
                  variant="outline"
                  className="border-cyan-400/30 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"
                  onClick={handleCopy}
                >
                  {copied ? "Copied" : "Copy room"}
                </Button>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Share this room name with one other person so they can join the same call.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">Room status</h3>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-200">
                  {statusLabel}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {roomUsers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-white">{member.name}</p>
                      <p className="text-sm text-slate-400">
                        {member.name === user ? "This is you" : "Connected user"}
                      </p>
                    </div>
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                ))}

                {roomUsers.length < 2 && (
                  <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-slate-400">
                    One more user can join this room.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Ready users</h3>
                <p className="text-sm text-slate-400">
                  Choose someone from the sidebar and start the call.
                </p>
              </div>
              <span className="rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-medium text-cyan-200">
                {onlineUsers.length} online
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {onlineUsers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 px-4 py-5 text-sm text-slate-400">
                  No other users are ready yet.
                </div>
              )}

              {onlineUsers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => onSelectUser(member.id, member.name)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    selectedUserId === member.id
                      ? "border-cyan-400/40 bg-cyan-400/10"
                      : "border-white/10 bg-slate-900/70 hover:border-cyan-400/20 hover:bg-slate-900"
                  }`}
                >
                  <div>
                    <p className="font-medium text-white">{member.name}</p>
                    <p className="text-sm text-slate-400">Tap to call</p>
                  </div>
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
