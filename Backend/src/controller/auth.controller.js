import jwt from "jsonwebtoken"
import userModel from "../model/user.model.js"

const isProduction = process.env.NODE_ENV === "production"
const frontendUrl = (
  process.env.FRONTEND_URL ||
  (isProduction ? "https://perplexity-frontend-5iaa.onrender.com" : "http://localhost:5173")
).replace(/\/$/, "")
const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
}

export async function register(req, res) {
  const { userName, email, password } = req.body;
  const isUserExist = await userModel.findOne({
    $or: [{ userName }, { email }],
  });

  if (isUserExist) {
    return res.status(409).json({
      message: "User Already exist with this email and username ",
      success: false,
      err: "User Already exist",
    });
  }

  await userModel.create({
    userName,
    email,
    password,
    verified: true,
  });

  return res.status(201).json({
    message: "Registration successful. You can now log in.",
    success: true,
  });
}

export async function verifyEmail(req,res) {
    const {token}=req.query
    const decoded=jwt.verify(token,process.env.SECRET_URI)
    const user=await userModel.findOne({email:decoded.email})
    if(!user){
        return res.status(400).json({
            message:"Invalid Token",
            success:false,
            err:"User not found"
        })
    }
   user.verified = true;
await user.save();

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verified</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f5f7fb;
  font-family: Arial, Helvetica, sans-serif;
">

  <div style="
    max-width: 500px;
    margin: 80px auto;
    padding: 40px 30px;
    background: #ffffff;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  ">

    <div style="
      width: 64px;
      height: 64px;
      margin: 0 auto 20px;
      background: #dcfce7;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    ">
      ✓
    </div>

    <h1 style="
      margin-bottom: 12px;
      color: #111827;
    ">
      Email Verified Successfully
    </h1>

    <p style="
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 30px;
    ">
      Your email address has been successfully verified.
      You can now log in to your Perplexity account.
    </p>

    <a
      href="${frontendUrl}/login"
      style="
        display: inline-block;
        padding: 14px 28px;
        background-color: #111827;
        color: #ffffff;
        text-decoration: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
      "
    >
      Go to Login
    </a>

    <p style="
      margin-top: 30px;
      font-size: 13px;
      color: #9ca3af;
    ">
      © ${new Date().getFullYear()} Perplexity
    </p>

  </div>

</body>
</html>
`;

return res.status(200).send(html);
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
        success: false,
        err: "user not found",
      });
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
        success: false,
        err: "Incorrect Password",
      });
    }
    const token = jwt.sign(
      {
        id: user._id,
        userName: user.userName,
      },
      process.env.SECRET_URI,
      {
        expiresIn: "7d",
      }
    );

    // ✅ cookie, not cookies
    res.cookie("token", token, {
      ...authCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login Successful",
      success: true,
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
}
export async function getme(req,res) {
    const userId=req.user.id
    const user=await userModel.findById(userId).select("-password")
    if(!user){
        return res.status(404).json({
            message:"User Not Found",
        success:false,
        err:"User not found"
        })
    }
    res.status(200).json({
        message:"Fetched Successfull",
        user
    })
}
export async function logout(req, res) {
    res.clearCookie("token", authCookieOptions);
    return res.status(200).json({
        message: "Logout successful",
    });
}