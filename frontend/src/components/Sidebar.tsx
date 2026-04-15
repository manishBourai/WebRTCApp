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
    <aside className="w-full bg-card/90 ring-1 ring-border backdrop-blur-xl shadow-sm dark:bg-surface/95 lg:min-h-screen lg:w-[360px]">
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-4">
          <UserCircleIcon className="h-12 w-12 text-indigo-500" />
          <div>
            <p className="text-sm text-secondary">You joined as</p>
            <h2 className="text-xl font-semibold text-foreground">{user}</h2>
          </div>
        </div>

        {mode === "room" ? (
          <>
            <div className="rounded-3xl bg-card/85 p-4 ring-1 ring-border shadow-sm dark:bg-surface/90">
              <p className="text-sm uppercase tracking-[0.24em] text-secondary/80">Room Name</p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="break-all text-2xl font-semibold text-foreground">{roomId}</p>
                <Button
                  variant="outline"
                  className="border-border bg-muted/20 text-foreground hover:bg-muted/30"
                  onClick={handleCopy}
                >
                  {copied ? "Copied" : "Copy room"}
                </Button>
              </div>
              <p className="mt-3 text-sm leading-6 text-secondary">
                Share this room name with one other person so they can join the same call.
              </p>
            </div>

            <div className="rounded-3xl bg-card/85 p-4 ring-1 ring-border shadow-sm dark:bg-surface/90">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">Room status</h3>
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                  {statusLabel}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {roomUsers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3 dark:bg-muted/20"
                  >
                    <div>
                      <p className="font-medium text-foreground">{member.name}</p>
                      <p className="text-sm text-secondary">
                        {member.name === user ? "This is you" : "Connected user"}
                      </p>
                    </div>
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                ))}

                {roomUsers.length < 2 && (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-secondary">
                    One more user can join this room.
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-3xl bg-card/85 p-4 ring-1 ring-border shadow-sm dark:bg-surface/90">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Ready users</h3>
                <p className="text-sm text-secondary">
                  Choose someone from the sidebar and start the call.
                </p>
              </div>
              <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-medium text-cyan-400">
                {onlineUsers.length} online
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {onlineUsers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-secondary">
                  No other users are ready yet.
                </div>
              )}

              {onlineUsers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => onSelectUser(member.id, member.name)}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition duration-200 ${
                    selectedUserId === member.id
                      ? "bg-cyan-500/10 text-foreground"
                      : "bg-muted/30 text-foreground hover:bg-muted/40"
                  }`}
                >
                  <div>
                    <p className="font-medium text-foreground">{member.name}</p>
                    <p className="text-sm text-secondary">Tap to call</p>
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
