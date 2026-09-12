import { useState } from "react";
import "../../../Styles/Auth.css";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hook/useAuth";
const Register = () => {
    const [userName, setuserName] = useState("")
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")
const [confirmPassword, setconfirmPassword] = useState("")
const user=useSelector(state=>state.auth.user)
const loading =useSelector(state=>state.auth.loading)
const error = useSelector(state => state.auth.error)
const [verificationUrl, setVerificationUrl] = useState("")
const { handleRegister } = useAuth()
const navigate = useNavigate()
const SubmitForm=async (e)=>{
    e.preventDefault()
  const registered = await handleRegister({userName, email, password, confirmPassword})
  if (registered) {
    setVerificationUrl(registered.verificationUrl || "")
    if (!registered.verificationUrl) navigate("/login")
  }
}
if(!loading && user){
  return <Navigate to="/" replace/>
}
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account 🚀</h1>
        <p className="subtitle">Create your new account</p>

        <form onSubmit={SubmitForm}>
          <div className="input-group">
            <label>Username</label>
            <input
             value={userName}
             onChange={(e)=>{
                setuserName(e.target.value)
             }}
              type="text"
              placeholder="Enter username"
            />
          </div>

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
              placeholder="Create password"
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
            value={confirmPassword}
            onChange={(e)=>{
                setconfirmPassword(e.target.value)
            }}
              type="password"
              placeholder="Confirm password"
            />
          </div>

          {error && <p className="auth-error" role="alert">{error}</p>}
          {verificationUrl && <p className="verification-help">Email nahi aayi? <a href={verificationUrl}>Development verification link open karein</a></p>}
          <button type="submit">Register</button>
        </form>

        <p className="switch-text">
          Already have an account?{" "}
          <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;