import express from "express"
import { authUser } from "../middleware/auth.middleare.js"
import { registerValidator,loginValidator } from "../validator/auth.validator.js"
import {register,verifyEmail,login,getme,logout} from "../controller/auth.controller.js"
const appRouter=express.Router()

appRouter.post("/register",registerValidator,register)
appRouter.post("/login",loginValidator,login)
appRouter.get("/verify-email",verifyEmail)
appRouter.get('/get-me',authUser,getme)
appRouter.post('/logout',logout)

export default appRouter
