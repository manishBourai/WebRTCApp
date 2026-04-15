import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Sender from "@/utils/Sender";
import { motion } from "framer-motion";
import { PhoneIcon, UserGroupIcon, VideoCameraIcon } from "@heroicons/react/24/outline";

const HomePage = () => {
  const navigate = useNavigate();
  const [directName, setDirectName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomUserName, setRoomUserName] = useState("");
  const { setName, setRoomId, setMode, resetSession } = Sender();

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
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_26%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(145deg,_#020617_0%,_#0f172a_55%,_#111827_100%)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col gap-10">
        <motion.header
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-300/10 p-3">
              <VideoCameraIcon className="h-8 w-8 text-cyan-200" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
                Video calling
              </p>
              <h1 className="text-2xl font-semibold sm:text-3xl">Connectly</h1>
            </div>
          </div>
          <p className="max-w-xl text-sm text-slate-300 sm:text-right">
            Choose between a direct ready-to-call user list or a private room that only two people can join.
          </p>
        </motion.header>

        <div className="grid gap-8 xl:grid-cols-[1fr_1fr_0.9fr]">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-[0_30px_120px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:p-8"
          >
            <div className="rounded-[1.5rem] border border-cyan-400/20 bg-slate-950/75 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-cyan-400/10 p-3">
                  <PhoneIcon className="h-6 w-6 text-cyan-200" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
                    Direct call
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">Join the ready list</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Enter your name and appear in the sidebar so another user can call you directly.
                  </p>
                </div>
              </div>

              <form className="mt-6 space-y-4" onSubmit={joinLobby}>
                <div className="space-y-2">
                  <label className="text-sm text-slate-300" htmlFor="direct-name">
                    Your name
                  </label>
                  <Input
                    id="direct-name"
                    className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    type="text"
                    placeholder="Enter your name"
                    value={directName}
                    onChange={(e) => setDirectName(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                >
                  Ready to call
                </Button>
              </form>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-[0_30px_120px_rgba(15,23,42,0.55)] backdrop-blur-xl sm:p-8"
          >
            <div className="rounded-[1.5rem] border border-cyan-400/20 bg-slate-950/75 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-cyan-400/10 p-3">
                  <UserGroupIcon className="h-6 w-6 text-cyan-200" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
                    Room call
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">Create or join a room</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Use the same room name on two devices. Only two people can enter that room.
                  </p>
                </div>
              </div>

              <form className="mt-6 space-y-4" onSubmit={joinRoom}>
                <div className="space-y-2">
                  <label className="text-sm text-slate-300" htmlFor="room-user-name">
                    Your name
                  </label>
                  <Input
                    id="room-user-name"
                    className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    type="text"
                    placeholder="Enter your name"
                    value={roomUserName}
                    onChange={(e) => setRoomUserName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300" htmlFor="room-name">
                    Room name
                  </label>
                  <Input
                    id="room-name"
                    className="h-12 border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    type="text"
                    placeholder="example: team-call"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                >
                  Join room
                </Button>
              </form>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
          >
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/80">
              How it works
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4">
                <p className="text-sm text-slate-400">Option 1</p>
                <p className="mt-2 text-lg font-medium">Sidebar direct calling</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Users enter a name, appear in the ready list, and can call each other directly from the sidebar.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-4">
                <p className="text-sm text-slate-400">Option 2</p>
                <p className="mt-2 text-lg font-medium">Private room</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Users share a room name and only two people can join that room before starting the call.
                </p>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
