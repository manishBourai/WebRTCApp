import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { io, Socket } from "socket.io-client";
import Sender from "@/utils/Sender";


const CallBox = () => {
  const myVideo = useRef<HTMLVideoElement | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
const {setAllUser,receiver,setReceiver,name,connect,setConnection,receiverName,setReceiverName}=Sender()
const remoteVideoRef=useRef<HTMLVideoElement>(null)





  useEffect(() => {
    // Get user media
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
      if (myVideo.current) {
        myVideo.current.srcObject = stream;
      }
    });

    // Setup socket connection
    const socketInstance = io("ws://localhost:8000");
    setSocket(socketInstance);

    socketInstance.emit("setName",name)

    socketInstance.on("allUser", (data:{name:string,id:string}[]) => {
      console.log(socketInstance.id);
      
      setAllUser(data.filter(e=>e.id!==socketInstance.id));
    });

    // Listen for offer
    socketInstance.on("offer", async (data) => {
      if(confirm(`${data.receiverName} is calling`)){
      console.log("Received offer, sending answer...");
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      
  const stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false})
      pc.addTrack(stream.getVideoTracks()[0])
       pc.ontrack = (event) => {
          console.log("Remote track event:", event);
        if(remoteVideoRef.current){
          remoteVideoRef.current.srcObject= new MediaStream([event.track])
          remoteVideoRef.current.play()
          setConnection(true)
        }
        }

        await pc.setRemoteDescription(data.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketInstance.emit("answer", { offer: answer, receiverId: data.from });
      
      setReceiver(data.from);

      pc.onicecandidate = (event) => { 
        
        if (event.candidate) {
          socketInstance.emit("iceCandidate", { candidate: event.candidate, receiver: data.from });
        }
      };
       socketInstance.on("iceCandidate", (data) => {
          pcRef.current?.addIceCandidate(data.candidate);
        
      });}
    });
    socketInstance.on("endCall",()=>{
      pcRef.current?.close()
      pcRef.current=null

      if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = null;
  }
  setConnection(false)
    })
     
    
   

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, []);











  

  async function handleCall() {
    if (!socket) return;
    const pc = new RTCPeerConnection();
      const stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false})


      pc.onicecandidate=(event)=>{
      
      if(event.candidate){
        socket.emit("iceCandidate",{candidate:event.candidate,receiver})
       
        
      }
      
    }
      pc.addTrack(stream.getVideoTracks()[0])
      
    pc.ontrack=(event)=>{
      if(remoteVideoRef.current){
        remoteVideoRef.current.srcObject=new MediaStream([event.track])
        setConnection(true)
      }
    }

    pc.onnegotiationneeded=async()=>{

      pcRef.current = pc;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("createOffer", { offer, receiverId:receiver,receiverName:name });
    }
    socket.on("iceCandidate",data=>{
      
      pc.addIceCandidate(data.candidate)
    })

    socket.on("answer", async (data) => {
      await pc.setRemoteDescription(data.offer);
    });
    
  }

  function handleCut(){
    socket?.emit("cutCall",receiver)
    pcRef.current?.close()
    pcRef.current=null
    setReceiverName(null)
 if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = null;
  }
  setConnection(false)
  }
  async function startScreen(){
    const screen=await navigator.mediaDevices.getDisplayMedia({video:true})
    if(myVideo.current?.srcObject){
      (myVideo.current.srcObject as MediaStream).getTracks().forEach(track=>track.stop())
    }
    myVideo.current!.srcObject=screen
    myVideo.current!.play()
    if(pcRef.current&&socket){

      const videoTrack= screen.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find(s => s.track?.kind === "video");
      if(sender){
        await sender.replaceTrack(videoTrack)
      }
      pcRef.current.onnegotiationneeded=async()=>{
      const offer = await pcRef.current?.createOffer();
      await pcRef.current?.setLocalDescription(offer);
      socket.emit("createOffer", { offer, receiverId:receiver,receiverName:name });
    }}
  }


  return (
    <div className="relative w-full h-screen bg-black">
  {/* Remote Video (in the background, full screen when connected) */}
  <video
    ref={remoteVideoRef}
    autoPlay
    playsInline
    className={`w-full h-full object-cover ${connect ? "" : "hidden"}`}
    style={{  transform: "scaleX(-1)" }}
  />

  {/* My Video (initially full screen, becomes PiP when connected) */}
  <video
    ref={myVideo}
    autoPlay
    playsInline
    muted // It's good practice to mute your own video to prevent feedback
    className={`
      transition-all duration-300 ease-in-out
      ${
        connect
          ? "absolute top-4 right-4 w-1/4 max-w-[250px] h-auto rounded-4xl border-2 border-white z-10"
          : "w-full h-full object-cover"
      }
    `}
    style={{ transform: "scaleX(-1)" }}
  />

  {/* Call Invitation Text (shown before connection) */}
  {!connect && receiverName && (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
      <h1 className="text-5xl text-white text-center">
       {receiverName}
      </h1>
    </div>
  )}

  {/* Call Control Buttons */}
  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
    <Button
      onClick={handleCall}
      className={`${receiver && !connect ? "" : "hidden"} bg-green-500 hover:bg-green-600`}
    >
      Call
    </Button>
    <Button
      variant={"destructive"}
      size={"default"}
      onClick={handleCut}
      className={`${connect ? "" : "hidden"}`}
    >
      Cut Call
    </Button>
    <Button
      variant={"default"}
      size={"default"}
      onClick={startScreen}
      className={`${connect ? "" : "hidden"}`}
    >
      screen share
    </Button>
  </div>
</div>

  );
};

export default CallBox;
