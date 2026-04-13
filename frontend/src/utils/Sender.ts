import {create} from "zustand"
import {  io, Socket } from "socket.io-client"

type sender = {
    mySocket: Socket | null
    name: string | null
    receiver:string|null
    allUser: {name:string,id:string}[] | null
    setAllUser: (value:{name:string,id:string}[]) => void
    setReceiver: (value: string|null)=> void
    setName:(value:string)=>void
    connect:boolean
    setConnection:(value:boolean)=>void
    receiverName:string|null
    setReceiverName:(value:string|null)=>void
    setSocketIn:()=>void

}
const Sender=create<sender>((set)=>({
 mySocket:null,
 name:null,
 allUser:null,
 receiver:null,
 connect:false,
 receiverName:null,

 setAllUser:(value:{name:string,id:string}[])=>{
    set({allUser:value})
 },
 setReceiver:(value)=>{
    set({receiver:value})
 },
 setName:(value)=>{
   set({name:value})
 },
 setConnection:(value)=>{
   set({connect:value})
 },
 setReceiverName:(value)=>{
   console.log(value);
   
   set({receiverName:value})
 },
 setSocketIn:async()=>{
  let socket
  if (!socket) {
     const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || "http://localhost:8000";
    console.log("Connecting socket to:", SOCKET_SERVER_URL);
    
      socket = io(SOCKET_SERVER_URL,{
         transports: ["websocket"],
      });
  }
  set({mySocket:socket})
 }
 
 
}))


export default Sender