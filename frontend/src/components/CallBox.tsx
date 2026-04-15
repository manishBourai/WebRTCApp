import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import Sender from "@/utils/Sender";
import { getSocket } from "@/store/socket";
import {
  PhoneIcon,
  PhoneXMarkIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/solid";
import { Socket } from "socket.io-client";

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const CallBox = () => {
  const myVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const {
    name,
    mode,
    roomId,
    roomUsers,
    onlineUsers,
    receiver,
    receiverName,
    setReceiverName,
    connect,
    setConnection,
    setReceiver,
    setRoomUsers,
    setRoomStatus,
    setOnlineUsers,
  } = Sender();

  const attachVideo = async (
    videoElement: HTMLVideoElement | null,
    stream: MediaStream,
    muted = false
  ) => {
    if (!videoElement) return;

    videoElement.srcObject = stream;
    videoElement.muted = muted;

    try {
      await videoElement.play();
    } catch (error) {
      console.error("Video play failed:", error);
    }
  };

  const ensureLocalStream = async () => {
    if (localStreamRef.current) {
      return localStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: true,
    });

    localStreamRef.current = stream;
    await attachVideo(myVideo.current, stream, true);
    return stream;
  };

  const resetRemoteVideo = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setConnection(false);
  };

  const cleanupPeerConnection = () => {
    if (!pcRef.current) return;

    pcRef.current.onicecandidate = null;
    pcRef.current.ontrack = null;
    pcRef.current.close();
    pcRef.current = null;
  };

  const createPeerConnection = (activeSocket: Socket, targetReceiver: string) => {
    cleanupPeerConnection();

    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        activeSocket.emit("iceCandidate", {
          candidate: event.candidate,
          receiverId: targetReceiver,
        });
      }
    };

    pc.ontrack = async (event) => {
      const [remoteStream] = event.streams;
      if (!remoteStream) return;

      await attachVideo(remoteVideoRef.current, remoteStream);
      setConnection(true);
    };

    return pc;
  };

  useEffect(() => {
    if (!name || !mode) return;

    const socketIn = getSocket();
    socketIn.connect();
    setSocket(socketIn);

    const setup = async () => {
      try {
        await ensureLocalStream();
      } catch (error) {
        console.error("Unable to access camera or microphone:", error);
        setErrorMessage("Camera or microphone permission was blocked.");
      }

      const syncPresence = () => {
        socketIn.emit("setProfile", { name, mode });

        if (mode === "room") {
          socketIn.emit("joinRoom", { roomId });
        } else {
          socketIn.emit("joinLobby");
        }
      };

      if (socketIn.connected) {
        syncPresence();
      }

      socketIn.on("connect", syncPresence);

      socketIn.on("allUser", (data: { name: string; id: string }[]) => {
        if (mode !== "lobby") return;
        const nextUsers = data.filter((user) => user.id !== socketIn.id);
        setOnlineUsers(nextUsers);

        if (receiver && !nextUsers.some((user) => user.id === receiver)) {
          setReceiver(null);
          setReceiverName(null);
        }
      });

      socketIn.on("roomUpdate", (data) => {
        if (mode !== "room") return;

        const users = data.users ?? [];
        const otherUser = users.find(
          (user: { id: string; name: string }) => user.id !== socketIn.id
        );

        setRoomUsers(users);
        setReceiver(otherUser?.id ?? null);
        setReceiverName(otherUser?.name ?? null);
        setRoomStatus(users.length === 2 ? "ready" : "waiting");
        setErrorMessage("");
      });

      socketIn.on("roomError", (message: string) => {
        setErrorMessage(message);
        if (mode === "room") {
          setRoomStatus(message.includes("2 people") ? "full" : "waiting");
        }
      });

      socketIn.on("offer", async (data) => {
        try {
          const stream = await ensureLocalStream();
          setReceiver(data.from);
          setReceiverName(data.receiverName ?? null);

          const pc = createPeerConnection(socketIn, data.from);

          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream);
          });

          await pc.setRemoteDescription(data.offer);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socketIn.emit("answer", {
            offer: answer,
            receiverId: data.from,
          });
        } catch (error) {
          console.error("Failed to answer call:", error);
        }
      });

      socketIn.on("answer", async (data) => {
        try {
          await pcRef.current?.setRemoteDescription(data.offer);
          setConnection(true);
        } catch (error) {
          console.error("Failed to apply answer:", error);
        }
      });

      socketIn.on("iceCandidate", async (data) => {
        try {
          await pcRef.current?.addIceCandidate(data.candidate);
        } catch (error) {
          console.error("Failed to add ICE candidate:", error);
        }
      });

      socketIn.on("endCall", () => {
        cleanupPeerConnection();
        resetRemoteVideo();
      });
    };

    setup();

    return () => {
      if (mode === "room") {
        socketIn.emit("leaveRoom");
      }

      socketIn.off("connect");
      socketIn.off("allUser");
      socketIn.off("roomUpdate");
      socketIn.off("roomError");
      socketIn.off("offer");
      socketIn.off("answer");
      socketIn.off("iceCandidate");
      socketIn.off("endCall");
      socketIn.disconnect();

      cleanupPeerConnection();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      resetRemoteVideo();
      setRoomUsers([]);
      setOnlineUsers([]);
    };
  }, [
    mode,
    name,
    roomId,
    setConnection,
    setOnlineUsers,
    setReceiver,
    setReceiverName,
    setRoomStatus,
    setRoomUsers,
  ]);

  async function handleCall() {
    if (!socket || !receiver) {
      setErrorMessage(
        mode === "room"
          ? "Wait for the second person to join the room."
          : "Choose a user from the sidebar first."
      );
      return;
    }

    if (mode === "room" && roomUsers.length < 2) {
      setErrorMessage("Wait for the second person to join the room.");
      return;
    }

    try {
      const stream = await ensureLocalStream();
      const pc = createPeerConnection(socket, receiver);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("createOffer", { offer, receiverId: receiver });
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to start call:", error);
      setErrorMessage("Unable to start the call right now.");
    }
  }

  function handleCut() {
    socket?.emit("cutCall", receiver);
    cleanupPeerConnection();
    resetRemoteVideo();
  }

  const canCall =
    mode === "room" ? roomUsers.length === 2 && !connect : !!receiver && !connect;

  const waitingTitle =
    mode === "room"
      ? receiverName
        ? `${receiverName} is in the room`
        : "Waiting for someone to join your room"
      : receiverName
        ? `Ready to call ${receiverName}`
        : "Choose a user from the sidebar";

  const waitingText =
    mode === "room"
      ? receiverName
        ? "Start the call when both of you are ready."
        : `Share room name "${roomId}" with one other person.`
      : receiverName
        ? "Press Start call when you want to begin."
        : onlineUsers.length > 0
          ? "Tap a ready user in the sidebar to start a direct call."
          : "No users are ready right now. Ask the other user to enter their name first.";

  return (
    <section className="relative flex min-h-[calc(100vh-340px)] flex-col p-3 sm:min-h-[calc(100vh-360px)] sm:p-4 lg:min-h-screen lg:p-6">
      <div className="relative flex min-h-[65vh] flex-1 overflow-hidden rounded-[2rem] bg-card shadow-[0_24px_80px_rgba(15,23,42,0.08)] ring-1 ring-border dark:bg-surface">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`h-full w-full object-cover ${connect ? "" : "hidden"}`}
          style={{ transform: "scaleX(-1)" }}
        />

        <video
          ref={myVideo}
          autoPlay
          playsInline
          muted
          className={`transition-all duration-300 ease-in-out ${
            connect
              ? "absolute right-3 top-3 z-10 h-28 w-24 rounded-[1.5rem] border border-border object-cover shadow-lg sm:h-40 sm:w-32 lg:right-6 lg:top-6 lg:h-48 lg:w-40"
              : "h-full w-full object-cover"
          }`}
          style={{ transform: "scaleX(-1)" }}
        />

        {!connect && (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(248,250,252,0.4),rgba(248,250,252,0.85))] p-6 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.36),rgba(15,23,42,0.88))]">
            <div className="max-w-md text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-500 ring-1 ring-cyan-500/20 dark:text-cyan-300">
                <VideoCameraIcon className="w-8" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-foreground sm:text-3xl">
                {waitingTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-secondary sm:text-base">
                {waitingText}
              </p>
              {errorMessage && (
                <p className="mt-4 rounded-full bg-rose-500/10 px-4 py-2 text-sm text-rose-400">
                  {errorMessage}
                </p>
              )}
            </div>
          </div>
        )}

        {connect && receiverName && (
          <div className="absolute left-4 top-4 z-10 rounded-full bg-card/90 px-4 py-2 text-sm text-foreground shadow-sm backdrop-blur dark:bg-surface/80">
            Live with {receiverName}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <Button
          onClick={handleCall}
          className={`${canCall ? "" : "hidden"} h-11 rounded-[1.5rem] bg-accent text-accent-foreground px-6 shadow-sm hover:bg-accent/90`}
        >
          <PhoneIcon className="size-4" />
          Start call
        </Button>

        <Button
          variant="destructive"
          size="default"
          onClick={handleCut}
          className={`${connect ? "" : "hidden"} h-11 rounded-[1.5rem] px-6`}
        >
          <PhoneXMarkIcon className="size-4" />
          End call
        </Button>
      </div>
    </section>
  );
};

export default CallBox;
