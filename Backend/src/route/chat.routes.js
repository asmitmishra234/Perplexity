import {Router} from "express"
import { authUser } from "../middleware/auth.middleare.js"
import { sendMessage,getChats,getmessages, deleteChats } from "../controller/chat.controller.js"
const chatRouter=Router()
 
chatRouter.post('/message',authUser,sendMessage)
chatRouter.get('/message',authUser,getChats)
chatRouter.get('/:chatId/message',authUser,getmessages)
chatRouter.delete('/delete/:chatId',authUser,deleteChats)

export default chatRouter