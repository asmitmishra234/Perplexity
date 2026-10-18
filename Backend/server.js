import 'dotenv/config'; 
import connectToDb from "./src/config/database.js"
import app from "./src/app.js"
import http from "http"
import { initServer } from './src/sockets/server.socket.js';
connectToDb()
const httpServer=http.createServer(app)
initServer(httpServer)
const port = Number(process.env.PORT) || 3000
httpServer.listen(port,()=>{
    console.log(`Server is ready on port ${port}`)
})