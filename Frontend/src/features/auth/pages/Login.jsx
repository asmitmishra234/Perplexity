import React from "react";
import { useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import "../../../Styles/Auth.css";
import { useAuth } from "../hook/useAuth";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
const Login = () => {

    const [email, setEmail] = useState("")
const [password, setPassword] = useState("")
const user=useSelector(state=>state.auth.user)
const loading=useSelector(state=>state.auth.loading)
const error=useSelector(state=>state.auth.error)
const {handleLogin}=useAuth()
const navigate=useNavigate()
const SubmitForm=async(e)=>{
    e.preventDefault()
    const payLoad={
        email,
        password
    }
const success = await handleLogin(payLoad); 
if (success) 
  {
     navigate("/"); 
    } 
  };
  if(!loading && user){
    return <Navigate to="/" replace/>
  }
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Welcome Back 👋</h1>
        <p className="subtitle">Login to your account</p>

        <form onSubmit={SubmitForm}>
          <div className="input-group">
            <label>Email</label>
            <input
                value={email}
            onChange={(e)=>{
                setEmail(e.target.value)
            }}
              type="email"
              placeholder="Enter your email"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
               value={password}
             onChange={(e)=>{
                setPassword(e.target.value)
             }}
              type="password"
              placeholder="Enter your password"
            />
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}
          <button type="submit">Login</button>
        </form>

        <p className="switch-text">
          Don't have an account?{" "}
          <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
};

export default Login;