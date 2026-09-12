
import mongoose from "mongoose"
const connectToDb=async()=>{
 await mongoose.connect(process.env.MONGO_URI)
 .then(()=>{
    console.log("Database is Connected to mongoDb")
 })
}
export default connectToDb