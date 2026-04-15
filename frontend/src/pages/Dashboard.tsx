import CallBox from "@/components/CallBox";
import Sidebar from "@/components/Sidebar";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";
import Sender from "@/utils/Sender";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const {
    name,
    mode,
    roomId,
    roomUsers,
    onlineUsers,
    roomStatus,
    receiver,
    setReceiver,
    setReceiverName,
  } = Sender();
  const { theme, toggleTheme } = useTheme();

  if (!name || !mode) {
    return <Navigate to="/" replace />;
  }

  if (mode === "room" && !roomId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-6 lg:sticky lg:top-6">
          <div className="flex items-center justify-between rounded-[2rem] border border-border bg-card/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:bg-surface/95">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-secondary/70">Connectly</p>
              <h1 className="mt-2 text-xl font-semibold text-foreground">Call control</h1>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
          <Sidebar
            user={name}
            mode={mode}
            roomId={roomId}
            roomUsers={roomUsers}
            onlineUsers={onlineUsers}
            roomStatus={roomStatus}
            selectedUserId={receiver}
            onSelectUser={(id, selectedName) => {
              setReceiver(id);
              setReceiverName(selectedName);
            }}
          />
        </aside>

        <main className="rounded-[2rem] border border-border bg-card/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] dark:bg-surface/95">
          <CallBox />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
