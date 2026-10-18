import {Server} from "socket.io"
import { allowedOrigins } from "../config/cors.js";
let io;
export function initServer(httpServer){
    io=new Server(httpServer,{
        cors:{
            origin:allowedOrigins,
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