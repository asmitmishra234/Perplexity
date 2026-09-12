import  jwt from "jsonwebtoken"
export async function authUser(req,res,next) {
    const token=req.cookies.token
    if(!token){
        return res.status(401).json({
            messsage:"Unauthorized",
            success:false,
            err:"No token Provided"
        })
    }
    try{
  const decoded=jwt.verify(token,process.env.SECRET_URI)
  req.user=decoded
  next()
    }catch(err){
   return res.status(401).json({
    message:"Unauthorized",
    success:false,
    err:"Invalid Token"
   })
    }
}