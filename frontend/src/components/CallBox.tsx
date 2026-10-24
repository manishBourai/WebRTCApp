import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, ShieldAlert, Video, VideoOff, Wifi, WifiOff } from "lucide-react";
import { Socket } from "socket.io-client";
import Sender from "@/utils/Sender";
import { getSocket } from "@/store/socket";

const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type MediaStatus = "requesting" | "ready" | "denied" | "unavailable";
type CallStatus = "idle" | "connecting" | "connected" | "disconnected";
type SignalingStatus = "connecting" | "connected" | "disconnected";

const isPermissionError = (error: unknown) => error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError" || error.name === "SecurityError");

const CallBox = () => {
  const myVideo = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [mediaStatus, setMediaStatus] = useState<MediaStatus>("requesting");
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [signalingStatus, setSignalingStatus] = useState<SignalingStatus>("connecting");
  const { name, mode, roomId, roomUsers, onlineUsers, receiver, receiverName, setReceiverName, connect, setConnection, setReceiver, setRoomUsers, setRoomStatus, setOnlineUsers } = Sender();
  const receiverRef = useRef(receiver);
  receiverRef.current = receiver;

  useEffect(() => {
    if (mediaStatus === "ready" && localStreamRef.current && myVideo.current) {
      void attachVideo(myVideo.current, localStreamRef.current, true);
    }
  }, [connect, mediaStatus]);

  const attachVideo = async (element: HTMLVideoElement | null, stream: MediaStream, muted = false) => {
    if (!element) return;
    element.srcObject = stream;
    element.muted = muted;
    try { await element.play(); } catch (error) { console.error("Video play failed:", error); }
  };

  const ensureLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    setMediaStatus("requesting");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Media devices are unavailable in this browser context.");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      localStreamRef.current = stream;
      setMediaStatus("ready");
      await attachVideo(myVideo.current, stream, true);
      return stream;
    } catch (error) {
      setMediaStatus(isPermissionError(error) ? "denied" : "unavailable");
      throw error;
    }
  };

  const resetRemoteVideo = () => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setConnection(false);
  };

  const cleanupPeerConnection = () => {
    if (!pcRef.current) return;
    pcRef.current.onicecandidate = null;
    pcRef.current.ontrack = null;
    pcRef.current.onconnectionstatechange = null;
    pcRef.current.close();
    pcRef.current = null;
  };

  const createPeerConnection = (activeSocket: Socket, targetReceiver: string) => {
    cleanupPeerConnection();
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;
    setCallStatus("connecting");
    pc.onicecandidate = (event) => {
      if (event.candidate) activeSocket.emit("iceCandidate", { candidate: event.candidate, receiverId: targetReceiver });
    };
    pc.ontrack = async (event) => {
      const [remoteStream] = event.streams;
      if (!remoteStream) return;
      await attachVideo(remoteVideoRef.current, remoteStream);
      setCallStatus("connected");
      setConnection(true);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setCallStatus("connected");
        setConnection(true);
      } else if (pc.connectionState === "connecting") {
        setCallStatus("connecting");
      } else if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setCallStatus("disconnected");
        setConnection(false);
      } else if (pc.connectionState === "closed") {
        setCallStatus("idle");
        setConnection(false);
      }
    };
    return pc;
  };

  useEffect(() => {
    if (!name || !mode) return;
    const socketIn = getSocket();
    socketIn.connect();
    setSocket(socketIn);
    setSignalingStatus(socketIn.connected ? "connected" : "connecting");

    const syncPresence = () => {
      setSignalingStatus("connected");
      socketIn.emit("setProfile", { name, mode });
      if (mode === "room") socketIn.emit("joinRoom", { roomId });
      else socketIn.emit("joinLobby");
    };
    const onDisconnect = () => setSignalingStatus("disconnected");
    const onConnectError = () => setSignalingStatus("disconnected");

    const setup = async () => {
      try { await ensureLocalStream(); }
      catch (error) {
        console.error("Unable to access camera or microphone:", error);
        setErrorMessage(isPermissionError(error) ? "Camera or microphone permission was denied." : "Camera or microphone is unavailable. Check your device and browser settings.");
      }

      if (socketIn.connected) syncPresence();
      socketIn.on("connect", syncPresence);
      socketIn.on("disconnect", onDisconnect);
      socketIn.on("connect_error", onConnectError);

      socketIn.on("allUser", (data: { name: string; id: string }[]) => {
        if (mode !== "lobby") return;
        const users = data.filter((user) => user.id !== socketIn.id);
        setOnlineUsers(users);
        if (receiverRef.current && !users.some((user) => user.id === receiverRef.current)) {
          setReceiver(null);
          setReceiverName(null);
        }
      });

      socketIn.on("roomUpdate", (data) => {
        if (mode !== "room") return;
        const users = data.users ?? [];
        const otherUser = users.find((user: { id: string; name: string }) => user.id !== socketIn.id);
        setRoomUsers(users);
        setReceiver(otherUser?.id ?? null);
        setReceiverName(otherUser?.name ?? null);
        setRoomStatus(users.length === 2 ? "ready" : "waiting");
        setErrorMessage("");
      });

      socketIn.on("roomError", (message: string) => {
        setErrorMessage(message);
        if (mode === "room") setRoomStatus(message.includes("2 people") ? "full" : "waiting");
      });

      socketIn.on("offer", async (data) => {
        try {
          const stream = await ensureLocalStream();
          setReceiver(data.from);
          setReceiverName(data.receiverName ?? null);
          const pc = createPeerConnection(socketIn, data.from);
          stream.getTracks().forEach((track) => pc.addTrack(track, stream));
          await pc.setRemoteDescription(data.offer);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketIn.emit("answer", { offer: answer, receiverId: data.from });
        } catch (error) {
          console.error("Failed to answer call:", error);
          setErrorMessage(isPermissionError(error) ? "Allow camera and microphone access to answer this call." : "Unable to access camera or microphone for this call.");
        }
      });

      socketIn.on("answer", async (data) => {
        try { await pcRef.current?.setRemoteDescription(data.offer); }
        catch (error) { console.error("Failed to apply answer:", error); setErrorMessage("Could not establish the call. Try again."); }
      });

      socketIn.on("iceCandidate", async (data) => {
        try { await pcRef.current?.addIceCandidate(data.candidate); }
        catch (error) { console.error("Failed to add ICE candidate:", error); }
      });

      socketIn.on("endCall", () => {
        cleanupPeerConnection();
        resetRemoteVideo();
        setCallStatus("idle");
        setErrorMessage("");
      });
    };
    void setup();

    return () => {
      if (mode === "room") socketIn.emit("leaveRoom");
      socketIn.off("connect", syncPresence);
      socketIn.off("disconnect", onDisconnect);
      socketIn.off("connect_error", onConnectError);
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
    // These helpers use refs and stable Zustand actions; register socket handlers once per session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, name, roomId, setConnection, setOnlineUsers, setReceiver, setReceiverName, setRoomStatus, setRoomUsers]);

  const handleCall = async () => {
    if (!socket || !receiver) {
      setErrorMessage(mode === "room" ? "Wait for the second person to join the room." : "Choose a person from the ready list first.");
      return;
    }
    if (mode === "room" && roomUsers.length < 2) {
      setErrorMessage("Wait for the second person to join the room.");
      return;
    }
    try {
      const stream = await ensureLocalStream();
      const pc = createPeerConnection(socket, receiver);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("createOffer", { offer, receiverId: receiver });
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to start call:", error);
      setErrorMessage(isPermissionError(error) ? "Allow camera and microphone access to start the call." : "Unable to start the call right now. Check your camera and microphone.");
    }
  };

  const handleEndCall = () => {
    socket?.emit("cutCall", receiver);
    cleanupPeerConnection();
    resetRemoteVideo();
    setCallStatus("idle");
  };

  const canCall = mode === "room" ? roomUsers.length === 2 && !connect && callStatus !== "connecting" : Boolean(receiver) && !connect && callStatus !== "connecting";
  const title = callStatus === "connected" ? `You’re talking with ${receiverName ?? "another person"}`
    : callStatus === "connecting" ? `Connecting to ${receiverName ?? "the other person"}…`
    : callStatus === "disconnected" ? "Call connection lost"
    : mode === "room" ? receiverName ? `${receiverName} is in the room` : "Your room is ready when they are"
    : receiverName ? `Ready to call ${receiverName}` : "Choose someone to start a call";
  const description = callStatus === "connected" ? "Your call is live. Use End call when you’re finished."
    : callStatus === "connecting" ? "Waiting for the other person’s video connection."
    : callStatus === "disconnected" ? "The peer connection was interrupted. You can try starting the call again."
    : mode === "room" ? receiverName ? "Both people are here. Start the call when you’re ready." : `Share “${roomId}” with one person to meet here.`
    : receiverName ? "Start a one-to-one video call when you’re ready." : onlineUsers.length ? "Choose a ready person from the people panel." : "No one else is available yet. Keep this page open while others join.";

  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between gap-3 px-1 sm:mb-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{callStatus === "connected" ? receiverName : mode === "room" ? `Room · ${roomId}` : receiverName ?? "Ready list"}</p>
          <p className="mt-0.5 truncate text-xs text-secondary">{callStatus === "connected" ? "One-to-one call" : mode === "room" ? "Private room" : "Available to connect"}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs ${signalingStatus === "connected" ? "text-secondary" : "text-error"}`} aria-live="polite">
          {signalingStatus === "connected" ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="hidden sm:inline">{signalingStatus === "connected" ? "Call service connected" : "Call service disconnected"}</span>
          <span className="sm:hidden">{signalingStatus === "connected" ? "Online" : "Offline"}</span>
        </span>
      </div>

      <div className="relative flex min-h-[52vh] flex-1 overflow-hidden rounded-[12px] border border-border bg-surface sm:min-h-[60vh] lg:min-h-[68vh]">
        <video ref={remoteVideoRef} autoPlay playsInline className={`absolute inset-0 h-full w-full object-cover ${connect ? "block" : "hidden"}`} />
        {!connect && mediaStatus === "ready" && <video ref={myVideo} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover opacity-50" style={{ transform: "scaleX(-1)" }} />}
        {connect && <video ref={myVideo} autoPlay playsInline muted className="absolute bottom-3 right-3 z-10 h-24 w-32 rounded-[9px] border border-border bg-background object-cover shadow-lg sm:bottom-5 sm:right-5 sm:h-36 sm:w-48" style={{ transform: "scaleX(-1)" }} aria-label="Your camera preview" />}

        {!connect && <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-background/55 via-background/75 to-background/95 px-5 py-10 text-center">
          <div className="max-w-md">
            <span className="mx-auto flex size-12 items-center justify-center rounded-[10px] border border-border bg-elevated text-accent">
              {mediaStatus === "denied" || mediaStatus === "unavailable" ? <VideoOff size={21} /> : callStatus === "disconnected" ? <WifiOff size={21} /> : <Video size={21} />}
            </span>
            <h1 className="mt-5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-secondary">{description}</p>
            {(mediaStatus === "denied" || mediaStatus === "unavailable") && <p className="mt-4 inline-flex items-center gap-2 rounded-[8px] border border-error/25 bg-error/10 px-3 py-2 text-left text-xs leading-5 text-error"><ShieldAlert size={15} className="shrink-0" />{mediaStatus === "denied" ? "Camera or microphone permission was denied. Allow access in your browser settings to call." : "Camera or microphone is unavailable. Check your browser context and connected devices."}</p>}
            {errorMessage && <p className="mt-3 text-xs leading-5 text-error" role="alert">{errorMessage}</p>}
          </div>
        </div>}

        {connect && <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-[8px] border border-white/10 bg-black/55 px-3 py-2 text-xs text-white backdrop-blur-sm sm:left-5 sm:top-5"><span className="size-1.5 rounded-full bg-success" />Live with {receiverName}</div>}
        {connect && errorMessage && <p className="absolute bottom-3 left-3 rounded-[8px] bg-black/65 px-3 py-2 text-xs text-error" role="alert">{errorMessage}</p>}
      </div>

      <div className="relative mt-4 flex min-h-14 items-center justify-center gap-2 sm:mt-5 sm:gap-3">
        {canCall && <button type="button" onClick={handleCall} className="inline-flex h-11 items-center justify-center gap-2 rounded-[9px] bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"><Phone size={16} />Start call</button>}
        {(connect || callStatus === "connecting") && <button type="button" onClick={handleEndCall} className="inline-flex h-11 items-center justify-center gap-2 rounded-[9px] bg-error px-5 text-sm font-semibold text-white transition hover:bg-error/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 focus-visible:ring-offset-background"><PhoneOff size={16} />End call</button>}
        {!canCall && !connect && callStatus !== "connecting" && callStatus !== "disconnected" && <p className="px-3 text-center text-xs text-muted-foreground">{mode === "room" && !receiver ? "Waiting for one more person to join" : !receiver ? "Choose a person to begin" : "Call service is reconnecting"}</p>}
      </div>
    </div>
  );
};

export default CallBox;
