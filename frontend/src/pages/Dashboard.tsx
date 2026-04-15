import CallBox from "@/components/CallBox";
import Sidebar from "@/components/Sidebar";
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

  if (!name || !mode) {
    return <Navigate to="/" replace />;
  }

  if (mode === "room" && !roomId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.15),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#111827_100%)] lg:flex">
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
      <main className="flex-1">
        <CallBox />
      </main>
    </div>
  );
};

export default Dashboard;
