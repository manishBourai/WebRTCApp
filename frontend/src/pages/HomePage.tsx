import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Link2, Video } from "lucide-react";
import Sender from "@/utils/Sender";
import ThemeToggle from "@/components/ThemeToggle";
import ThemePicker from "@/components/ThemePicker";
import { useTheme } from "@/hooks/useTheme";

const HomePage = () => {
  const navigate = useNavigate();
  const [directName, setDirectName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomUserName, setRoomUserName] = useState("");
  const { setName, setRoomId, setMode, resetSession } = Sender();
  const { theme, toggleTheme, accentSelection, accentColor, selectAccentPreset, selectCustomAccent } = useTheme();

  const joinLobby = (event: FormEvent) => {
    event.preventDefault();
    const name = directName.trim();
    if (!name) return;
    resetSession();
    setName(name);
    setMode("lobby");
    navigate("/dashboard");
  };

  const joinRoom = (event: FormEvent) => {
    event.preventDefault();
    const name = roomUserName.trim();
    const room = roomName.trim().toLowerCase();
    if (!name || !/^[a-f0-9]{32}$/.test(room)) return;
    resetSession();
    setName(name);
    setMode("room");
    setRoomId(room);
    navigate("/dashboard");
  };

  const createRoomCode = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    setRoomName(Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""));
  };

  return (
    <main className="min-h-screen px-5 pb-12 pt-5 sm:px-8 sm:pt-7">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-border pb-5">
          <a href="/" className="flex items-center gap-3 text-foreground" aria-label="Connectly home">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-accent text-accent-foreground">
              <Video size={19} strokeWidth={2.2} />
            </span>
            <span className="text-[17px] font-semibold tracking-tight">connectly</span>
          </a>
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden items-center gap-2 text-xs text-secondary sm:flex">
              <span className="size-1.5 rounded-full bg-success" />
              Private by design
            </span>
            <div className="flex items-center gap-2">
              <ThemePicker selection={accentSelection} color={accentColor} onSelectPreset={selectAccentPreset} onSelectCustom={selectCustomAccent} />
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </div>
        </header>

        <section className="grid gap-12 pb-10 pt-12 md:grid-cols-[0.9fr_1.1fr] md:gap-20 md:pb-16 md:pt-20">
          <div className="flex flex-col justify-center">
            <p className="mb-5 flex items-center gap-2 text-sm text-secondary">
              <span className="size-1.5 rounded-full bg-accent" />
              A quieter way to connect
            </p>
            <h1 className="max-w-lg text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-5xl">
              Good conversations start here.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-secondary">
              Join the ready list and meet someone, or share a room name for a private one-to-one call.
            </p>

            <form onSubmit={joinLobby} className="mt-9 max-w-md">
              <label htmlFor="direct-name" className="mb-2 block text-sm font-medium text-foreground">Your name</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="direct-name"
                  className="h-12 min-w-0 flex-1 rounded-[10px] border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground"
                  type="text"
                  placeholder="How should people know you?"
                  autoComplete="name"
                  maxLength={40}
                  value={directName}
                  onChange={(event) => setDirectName(event.target.value)}
                  required
                />
                <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  Join ready list <ArrowRight size={16} />
                </button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">You’ll appear to others while you’re here.</p>
            </form>
          </div>

          <section aria-labelledby="private-room-title" className="self-center border-t border-border pt-8 md:border-l md:border-t-0 md:py-5 md:pl-12">
            <div className="mb-7 flex items-start gap-3">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-elevated text-accent">
                <Link2 size={17} />
              </span>
              <div>
                <h2 id="private-room-title" className="text-base font-semibold text-foreground">Join a private room</h2>
                <p className="mt-1 text-sm leading-6 text-secondary">Create a secure invite code and share it privately with one person.</p>
              </div>
            </div>
            <form onSubmit={joinRoom} className="space-y-4">
              <div>
                <label htmlFor="room-user-name" className="mb-2 block text-sm font-medium text-foreground">Your name</label>
                <input id="room-user-name" className="h-11 w-full rounded-[9px] border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted-foreground" type="text" placeholder="Your name" autoComplete="name" maxLength={40} value={roomUserName} onChange={(event) => setRoomUserName(event.target.value)} required />
              </div>
              <div>
                <label htmlFor="room-name" className="mb-2 block text-sm font-medium text-foreground">Secure room code</label>
                <input id="room-name" className="h-11 w-full rounded-[9px] border border-border bg-surface px-3.5 text-sm text-foreground placeholder:text-muted-foreground" type="text" placeholder="Generate or paste a 32-character code" autoComplete="off" minLength={32} maxLength={32} pattern="[a-fA-F0-9]{32}" value={roomName} onChange={(event) => setRoomName(event.target.value)} required />
                <button type="button" onClick={createRoomCode} className="mt-2 text-xs font-medium text-accent underline-offset-4 hover:underline">Generate a new private room code</button>
              </div>
              <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[9px] border border-border bg-elevated px-4 text-sm font-medium text-foreground transition hover:border-muted-foreground/50 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                Join room <ArrowRight size={15} />
              </button>
            </form>
          </section>
        </section>

        <footer className="flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Private, direct conversations.</span>
          <span className="inline-flex items-center gap-2"><Check size={13} className="text-success" /> Peer-to-peer video calling</span>
        </footer>
      </div>
    </main>
  );
};

export default HomePage;
