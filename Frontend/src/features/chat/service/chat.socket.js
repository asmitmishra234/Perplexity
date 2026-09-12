import { io } from "socket.io-client"

export const initializationsocketconnection = () => {
    const socket = io("http://localhost:3000", {
        withCredentials: true,
    })

    socket.on("connect", () => {
        console.log("Connected to Socket io Server")
    })

    return socket
}