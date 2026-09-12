import express from "express"
import cors from "cors";
import cookieParser from "cookie-parser"
import appRouter from "./route/auth.routes.js"
import morgan from "morgan"
import chatRouter from "./route/chat.routes.js";
import messageRouter from "./route/message.routes.js";
const app=express()
app.use(cookieParser())
app.use(morgan('dev'))
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json())
app.use('/api/auth',appRouter)
app.use('/api/chats',chatRouter)
app.use('/api/message',messageRouter)
export default app