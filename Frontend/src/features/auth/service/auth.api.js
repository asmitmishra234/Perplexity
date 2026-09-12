import axios from "axios"
const api=axios.create({
    baseURL:"http://localhost:3000",
    withCredentials:true,
})
export async function register({userName,email,password,confirmPassword}){
    const response=await api.post("/api/auth/register",{userName,email,password,confirmPassword})
    return response.data
}
export async function login({email,password}){
    const response=await api.post("/api/auth/login",{email,password})
    return response.data
}
export async function getme(){
    const response=await api.get("/api/auth/get-me")
    return response.data
}
export async function logout(){
    const response=await api.post("/api/auth/logout")
    return response.data
}