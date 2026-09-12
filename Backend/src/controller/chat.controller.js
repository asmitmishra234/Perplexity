import { generateResponse,generateTitleChat } from "../services/ai.services.js"
import chatModel from"../model/chat.model.js"
import messageModel from "../model/message.model.js"
export const sendMessage=async (req,res)=>{
const {message,chat:chatId}=req.body

let chat=null,title=null;
if(!chatId){
title=await generateTitleChat(message)
console.log("title")
 chat=await chatModel.create({
user:req.user.id,
title
})
} else {
 chat=await chatModel.findOne({
     _id:chatId,
     user:req.user.id
 })

 if(!chat){
     return res.status(404).json({
          message:"Chat not found"
     })
 }
}

const userMessage=await messageModel.create({
    chat:chat._id,
    content:message,
    role:"user"
})

const messages=await messageModel.find({chat:chat._id})
const result= await generateResponse(messages)
const aimessage=await messageModel.create({
    chat:chat._id,
    content:result,
    role:"ai"
})
chat.updatedAt = new Date()
await chat.save()
res.status(201).json({
    response:result,
    title,
    chat,
    aimessage
})
}
export async function getChats(req,res){
    const user=req.user
    const chats=await chatModel.find({user:user.id}).sort({updatedAt:-1})
    res.status(200).json({
        message:"Chats retrive successfully",
        chats
    })
}
export async function getmessages(req,res){
    const{chatId}=req.params
    const chat=await chatModel.findOne({
        _id:chatId,

        user:req.user.id
    })
    if(!chat){
        return res.status(404).json({
             mesaage:"chat not found"
        })
    }
    const messages=await messageModel.find({
        chat:chatId
    })
    res.status(200).json({
        mssage:"Messge fetched successfully",
        messages
    })
}
export async function deleteChats(req,res){
    const {chatId}=req.params
    const chat=await chatModel.findOneAndDelete({
        _id:chatId,
        user:req.user.id
    })
    await messageModel.deleteMany({
        chat:chatId
    })
        if(!chat){
        return res.status(404).json({
             mesaage:"chat not found"
        })
    }
    res.status(200).json({
        message:"Chat Deleted Successfully",
        
    })
}