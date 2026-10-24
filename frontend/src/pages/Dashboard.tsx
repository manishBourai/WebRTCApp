import { useState } from "react";
import { Navigate } from "react-router-dom";
import { UsersRound, Video } from "lucide-react";
import CallBox from "@/components/CallBox";
import Sidebar from "@/components/Sidebar";
import ThemePicker from "@/components/ThemePicker";
import ThemeToggle from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/hooks/useTheme";
import Sender from "@/utils/Sender";

const Dashboard = () => {
  const { name, mode, roomId, roomUsers, onlineUsers, roomStatus, receiver, setReceiver, setReceiverName } = Sender();
  const { theme, toggleTheme, accentSelection, accentColor, selectAccentPreset, selectCustomAccent } = useTheme();
  const [panelOpen, setPanelOpen] = useState(false);

  if (!name || !mode || (mode === "room" && !roomId)) return <Navigate to="/" replace />;

  const sidebar = <Sidebar user={name} mode={mode} roomId={roomId} roomUsers={roomUsers} onlineUsers={onlineUsers} roomStatus={roomStatus} selectedUserId={receiver} onSelectUser={(id, selectedName) => { setReceiver(id); setReceiverName(selectedName); setPanelOpen(false); }} />;

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2.5" aria-label="Connectly home">
          <span className="flex size-7 items-center justify-center rounded-[7px] bg-accent text-accent-foreground"><Video size={15} strokeWidth={2.3} /></span>
          <span className="text-sm font-semibold tracking-tight">connectly</span>
          <span className="hidden pl-2 text-xs text-muted-foreground sm:inline">/ {mode === "room" ? roomId : "Ready list"}</span>
        </a>
        <div className="flex items-center gap-2">
          <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
            <SheetTrigger asChild>
              <button type="button" className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-border px-3 text-xs font-medium text-secondary hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden" aria-label="Open people and room panel">
                <UsersRound size={15} />
                {mode === "lobby" ? onlineUsers.length : `${roomUsers.length}/2`}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(88vw,340px)] border-border bg-background p-0">
              <SheetTitle className="sr-only">People and room</SheetTitle>
              <SheetDescription className="sr-only">Your profile, available people, and room information.</SheetDescription>
              {sidebar}
            </SheetContent>
          </Sheet>
          <ThemePicker selection={accentSelection} color={accentColor} onSelectPreset={selectAccentPreset} onSelectCustom={selectCustomAccent} />
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1600px] flex-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="hidden border-r border-border lg:block">{sidebar}</div>
        <section className="flex min-h-0 min-w-0 flex-col p-3 sm:p-5 lg:p-7">
          <CallBox />
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
