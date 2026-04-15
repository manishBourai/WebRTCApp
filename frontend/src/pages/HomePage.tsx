import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sender from "@/utils/Sender";
import { motion } from "framer-motion";
import { PhoneIcon, SparklesIcon, UserGroupIcon, VideoCameraIcon } from "@heroicons/react/24/outline";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/hooks/useTheme";

const HomePage = () => {
  const navigate = useNavigate();
  const [directName, setDirectName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomUserName, setRoomUserName] = useState("");
  const { setName, setRoomId, setMode, resetSession } = Sender();
  const { theme, toggleTheme } = useTheme();

  const joinLobby = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = directName.trim();
    if (!trimmedName) return;

    resetSession();
    setName(trimmedName);
    setMode("lobby");
    navigate("/dashboard");
  };

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = roomUserName.trim();
    const trimmedRoom = roomName.trim().toLowerCase();
    if (!trimmedName || !trimmedRoom) return;

    resetSession();
    setName(trimmedName);
    setMode("room");
    setRoomId(trimmedRoom);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col gap-10">
        <motion.header
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col gap-6 rounded-[2rem] border border-border bg-card/80 p-6 shadow-[0_30px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:bg-surface/85 lg:flex-row lg:items-center lg:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.75rem] bg-indigo-500/10 text-indigo-500 shadow-sm ring-1 ring-indigo-500/10">
              <VideoCameraIcon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-secondary/80">
                Connectly
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Modern video calling, refined.
              </h1>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="rounded-3xl bg-gray-600 px-4 py-2 text-sm text-secondary-foreground shadow-sm dark:bg-muted/40 dark:text-secondary-foreground">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 mr-2" />
              WebRTC ready
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </motion.header>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.95fr]">
          <div className="grid gap-6">
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="group overflow-hidden rounded-[2rem] bg-card/90 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-inset ring-border transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(15,23,42,0.12)] dark:bg-surface/95"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-secondary/70">
                    Join ready list
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Be available to call instantly.
                  </h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-cyan-500/10 text-cyan-500 ring-1 ring-cyan-500/15">
                  <PhoneIcon className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-7 text-secondary">
                Enter your name, join the ready list, and connect with others in one click.
              </p>

              <form className="mt-8 space-y-5" onSubmit={joinLobby}>
                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary" htmlFor="direct-name">
                      Your name
                    </label>
                    <Input
                      id="direct-name"
                      className="h-14 rounded-[1.5rem] px-4"
                      type="text"
                      placeholder="Enter your name"
                      value={directName}
                      onChange={(e) => setDirectName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-[1.5rem] py-4">
                  Ready to call
                </Button>
              </form>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="group overflow-hidden rounded-[2rem] bg-card/90 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-inset ring-border transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_90px_rgba(15,23,42,0.12)] dark:bg-surface/95"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-secondary/70">
                    Create or join room
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-foreground">
                    Invite one other user securely.
                  </h2>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/15">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-7 text-secondary">
                Share a room name and keep the call private for just two people.
              </p>

              <form className="mt-8 space-y-5" onSubmit={joinRoom}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary" htmlFor="room-user-name">
                      Your name
                    </label>
                    <Input
                      id="room-user-name"
                      className="h-14 rounded-[1.5rem] px-4"
                      type="text"
                      placeholder="Enter your name"
                      value={roomUserName}
                      onChange={(e) => setRoomUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary" htmlFor="room-name">
                      Room name
                    </label>
                    <Input
                      id="room-name"
                      className="h-14 rounded-[1.5rem] px-4"
                      type="text"
                      placeholder="example: team-call"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-[1.5rem] py-4">
                  Join room
                </Button>
              </form>
            </motion.section>
          </div>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.16 }}
            className="rounded-[2rem] bg-card/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-inset ring-border dark:bg-surface/95"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-secondary/70">
                  How it works
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">
                  Streamlined calling in three simple steps.
                </h2>
              </div>
              <div className="rounded-3xl w-50 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-300 dark:bg-indigo-500/15">
                Premium feel
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {[
                {
                  title: "Enter your identity",
                  description: "Use your name to appear in the ready list or join a private room.",
                  icon: VideoCameraIcon,
                },
                {
                  title: "Choose your mode",
                  description: "Pick direct calling or a secure room for a more private session.",
                  icon: PhoneIcon,
                },
                {
                  title: "Start the call",
                  description: "Begin the conversation with clear connection details and simplified controls.",
                  icon: SparklesIcon,
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 rounded-[1.75rem] bg-muted/70 p-5 text-sm text-secondary dark:bg-muted/50">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-300">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 leading-6">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[1.75rem] bg-secondary/5 p-6 text-sm text-secondary dark:bg-secondary/10 dark:text-secondary-foreground">
              <p className="font-semibold">Ready list empty state</p>
              <p className="mt-2 leading-6 text-secondary/80 dark:text-secondary-foreground/80">
                When no one is available, the sidebar gently guides users to wait or create a room, keeping the interface calm and uncluttered.
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
