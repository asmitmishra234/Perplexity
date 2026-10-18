import { io } from "socket.io-client"
import { API_BASE_URL } from "../../../config/api.js"

export const initializationsocketconnection = () => {
    const socket = io(API_BASE_URL, {
        withCredentials: true,
    })

    socket.on("connect", () => {
        console.log("Connected to Socket io Server")
    })

    return socket
}