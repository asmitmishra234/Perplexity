import jwt from "jsonwebtoken"
import userModel from "../model/user.model.js"
import {sendEmail} from "../services/mail.services.js"

const isProduction = process.env.NODE_ENV === "production"
const backendUrl = (
  process.env.BACKEND_URL ||
  (isProduction ? "https://perplexity-1-f2d0.onrender.com" : `http://localhost:${process.env.PORT || 3000}`)
).replace(/\/$/, "")
const frontendUrl = (
  process.env.FRONTEND_URL ||
  (isProduction ? "https://perplexity-frontend-5iaa.onrender.com" : "http://localhost:5173")
).replace(/\/$/, "")
const authCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
}

export async function register(req,res) {
    
    const {userName,email,password}=req.body
    const isUserExist=await userModel.findOne({
        $or:[
            {userName},
            {email}
        ]
    })
    if(isUserExist){
      if (
        isProduction &&
        !isUserExist.verified &&
        isUserExist.email.toLowerCase() === email.toLowerCase()
      ) {
        const verificationToken = jwt.sign({
          email: isUserExist.email,
        }, process.env.SECRET_URI)
        const verificationUrl = `${backendUrl}/api/auth/verify-email?token=${verificationToken}`

        try {
          await sendEmail({
            to: isUserExist.email,
            subject: "Verify your email address | Perplexity",
            text: `Hi ${isUserExist.userName},\n\nPlease verify your email address:\n\n${verificationUrl}`,
            html: `<p>Hi ${isUserExist.userName},</p><p>Please verify your email address:</p><p><a href="${verificationUrl}">Verify your email</a></p>`,
          })
        } catch (error) {
          console.error("Verification email could not be sent:", error.message)
          return res.status(500).json({
            message: "Account exists, but verification email could not be sent.",
            success: false,
          })
        }

        return res.status(200).json({
          message: "Verification email sent. Please check your inbox.",
          success: true,
        })
      }

      if (!isUserExist.verified && process.env.NODE_ENV !== "production") {
        const verificationToken = jwt.sign({
          email: isUserExist.email,
        }, process.env.SECRET_URI)
        return res.status(201).json({
          message: "Account already exists. Use the development verification link below.",
          success: true,
          verificationUrl: `${backendUrl}/api/auth/verify-email?token=${verificationToken}`,
        })
      }
        return res.status(409).json({
            message:"User Already exist with this email and username ",
            success:false,
            err:"User Already exist"
        })
    }

    const user=await userModel.create({
        userName,
        email,
        password
    })

    const emailVerificationToken=jwt.sign({
        email:user.email
    },process.env.SECRET_URI)
const verificationUrl = `${backendUrl}/api/auth/verify-email?token=${emailVerificationToken}`
let emailSent = true
try {
await sendEmail({
  to: email,
  subject: "Verify your email address | Perplexity",

  text: `
Hi ${userName},

Welcome to Perplexity!

Thank you for creating your account. Please verify your email address by clicking the link below:

${verificationUrl}

If you did not create this account, you can safely ignore this email.

Best regards,
The Perplexity Team
`,

  html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f5f7fb;
  font-family: Arial, Helvetica, sans-serif;
  color: #1f2937;
">

  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width: 560px;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
          "
        >

          <!-- Header -->
          <tr>
            <td style="
              padding: 28px 32px;
              border-bottom: 1px solid #e5e7eb;
              text-align: center;
            ">
              <h1 style="
                margin: 0;
                font-size: 28px;
                color: #111827;
              ">
                Perplexity
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">

              <h2 style="
                margin: 0 0 16px;
                font-size: 24px;
                color: #111827;
              ">
                Welcome, ${userName}! 👋
              </h2>

              <p style="
                margin: 0 0 16px;
                font-size: 16px;
                line-height: 1.6;
                color: #4b5563;
              ">
                Thanks for creating your Perplexity account.
                Please verify your email address to activate your account
                and get started.
              </p>

              <!-- Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a
                  href="${verificationUrl}"
                  style="
                    display: inline-block;
                    padding: 14px 28px;
                    background-color: #111827;
                    color: #ffffff;
                    text-decoration: none;
                    font-size: 16px;
                    font-weight: 600;
                    border-radius: 8px;
                  "
                >
                  Verify My Email
                </a>
              </div>

              <p style="
                margin: 0 0 12px;
                font-size: 14px;
                line-height: 1.6;
                color: #6b7280;
              ">
                If the button above doesn't work, copy and paste the
                following link into your browser:
              </p>

              <p style="
                margin: 0 0 24px;
                font-size: 13px;
                line-height: 1.6;
                word-break: break-all;
              ">
                <a
                  href="${verificationUrl}"
                  style="color: #2563eb;"
                >
                  ${verificationUrl}
                </a>
              </p>

              <div style="
                padding: 16px;
                background-color: #f9fafb;
                border-radius: 8px;
              ">
                <p style="
                  margin: 0;
                  font-size: 13px;
                  line-height: 1.5;
                  color: #6b7280;
                ">
                  If you did not create this account, you can safely ignore
                  this email.
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              padding: 24px 32px;
              background-color: #f9fafb;
              text-align: center;
            ">
              <p style="
                margin: 0 0 8px;
                font-size: 13px;
                color: #6b7280;
              ">
                © ${new Date().getFullYear()} Perplexity. All rights reserved.
              </p>

              <p style="
                margin: 0;
                font-size: 12px;
                color: #9ca3af;
              ">
                This is an automated email. Please do not reply.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`,
});
} catch (error) {
  emailSent = false
  console.error("Verification email could not be sent:", error.message)
  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({
      message: "Account created, but verification email could not be sent.",
      success: false,
    })
  }
}

return res.status(201).json({
  message: emailSent ? "Registration successful. Please verify your email." : "Registration successful. Use the development verification link below.",
  success: true,
  ...(process.env.NODE_ENV !== "production" ? {
  verificationUrl,
  } : {}),
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

    if (!user.verified) {
      return res.status(400).json({
        message: "Please verify your email before Login",
        success: false,
        err: "Email not verified",
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