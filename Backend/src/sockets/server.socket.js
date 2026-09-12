import {Server} from "socket.io"
let io;
export function initServer(httpServer){
    io=new Server(httpServer,{
        cors:{
            origin:"http://localhost:5173",
            credentials:true,
        }
        
        
    })
    console.log("Socket io server is connected");
    io.on('connection',(socket)=>{
        console.log('A user connected :' +socket.id)
    })
}
export function getIO(){
    if(!io){
        throw new Error('socket.io not initialize')
    }
    return io
}