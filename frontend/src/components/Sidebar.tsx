import { useState } from "react";
import { Check, Copy, DoorOpen, UsersRound } from "lucide-react";

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

const Sidebar = ({ user, mode, roomId, roomUsers, onlineUsers, roomStatus, selectedUserId, onSelectUser }: SidebarProps) => {
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

  const status = roomStatus === "ready" ? "2 people in room" : roomStatus === "full" ? "Room is full" : "Waiting for one more";

  return (
    <aside className="flex h-full flex-col bg-background text-foreground">
      <div className="border-b border-border p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Your profile</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-elevated text-sm font-semibold text-accent">{user.slice(0, 1).toUpperCase()}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">In {mode === "lobby" ? "ready list" : "a private room"}</p>
          </div>
        </div>
      </div>

      {mode === "room" ? (
        <div className="p-5">
          <div className="flex items-center gap-2 text-sm font-medium"><DoorOpen size={16} className="text-accent" /> Private room</div>
          <p className="mt-3 break-all font-mono text-sm text-foreground">{roomId}</p>
          <button type="button" onClick={handleCopy} className="mt-3 inline-flex h-9 items-center gap-2 rounded-[8px] border border-border px-3 text-xs font-medium text-secondary transition hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-live="polite">
            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy room name"}
          </button>
          <div className="my-5 h-px bg-border" />
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Participants</h2>
            <span className="text-xs text-muted-foreground">{roomUsers.length}/2</span>
          </div>
          <ul className="mt-3 space-y-1">
            {roomUsers.map((member) => <li key={member.id} className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm"><span className="size-1.5 rounded-full bg-success" />{member.name}<span className="ml-auto text-xs text-muted-foreground">{member.name === user ? "You" : "Here"}</span></li>)}
          </ul>
          {roomUsers.length < 2 && <p className="mt-3 rounded-[8px] bg-elevated px-3 py-2.5 text-xs leading-5 text-secondary">Share the room name to invite one other person.</p>}
          <p className={`mt-4 text-xs ${roomStatus === "full" ? "text-error" : roomStatus === "ready" ? "text-success" : "text-secondary"}`}>{status}</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium"><UsersRound size={16} className="text-accent" /> Ready people</div>
            <span className="text-xs tabular-nums text-muted-foreground">{onlineUsers.length}</span>
          </div>
          {onlineUsers.length === 0 ? (
            <div className="mt-4 rounded-[9px] border border-dashed border-border px-3.5 py-4">
              <p className="text-sm text-foreground">You’re all set.</p>
              <p className="mt-1.5 text-xs leading-5 text-secondary">We’ll show people here as they join. Keep this page open to receive a call.</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-1 overflow-y-auto">
              {onlineUsers.map((member) => {
                const selected = selectedUserId === member.id;
                return <li key={member.id}><button type="button" onClick={() => onSelectUser(member.id, member.name)} aria-pressed={selected} className={`flex min-h-11 w-full items-center gap-3 rounded-[8px] px-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "bg-elevated text-foreground" : "text-secondary hover:bg-elevated hover:text-foreground"}`}><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-medium text-foreground">{member.name.slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1 truncate">{member.name}</span><span className="size-1.5 shrink-0 rounded-full bg-success" /></button></li>;
              })}
            </ul>
          )}
          {selectedUserId && <p className="mt-4 text-xs leading-5 text-secondary">Selected person is ready for a one-to-one call.</p>}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
