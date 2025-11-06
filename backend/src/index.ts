import { Server, Socket } from "socket.io";
import Express from "express";
import { createServer } from "http";

const app = Express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get("/",(req,res)=>{
  res.send("Welcome To WebRTC Backend")
})

let allSocket: {name:string,id:string}[] = [];

io.on("connection", (socket: Socket) => {
  console.log("server is connected", socket.id);
  
  socket.on("setName",date=>{
    allSocket.push({name:date,id:socket.id});
    io.emit("allUser", allSocket);
  })


  socket.on("createOffer", (data) => {
    
    io.to(data.receiverId).emit("offer", { offer: data.offer, from: socket.id ,receiverName:data.receiverName});
  });

  socket.on("answer", (data) => {
    io.to(data.receiverId).emit("answer", { myId: socket.id, offer: data.offer });
  });
  socket.on("iceCandidate",(data)=>{
    io.to(data.receiver).emit("iceCandidate",data)
  })
  socket.on("cutCall",(data)=>{
    io.to(data).emit("endCall")
  })

  socket.on("disconnect", () => {
    allSocket = allSocket.filter(e => e.id !== socket.id);
    // Update all clients after disconnect
    io.emit("allUser", allSocket);
    console.log("Disconnected", socket.id);
    console.log("Active sockets:", allSocket.length);
  });
});

server.listen(8000, () => {
  console.log("server is listen on 8000");
});


