import 'dotenv/config'; 
import connectToDb from "./src/config/database.js"
import app from "./src/app.js"
import http from "http"
import { initServer } from './src/sockets/server.socket.js';
connectToDb()
const httpServer=http.createServer(app)
initServer(httpServer)
httpServer.listen(3000,()=>{
    console.log("Server is ready for run ")
})