import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    type: "OAuth2",
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error("Email connection error:", error);
  } else {
    console.log("Email server is ready");
  }
});

export const sendEmail = async ({ to, subject, text, html }) => {
  console.log("EMAIL TO:", to);

  const emailOption = {
    from: process.env.EMAIL_USER,
    to: to,
    subject,
    text,
    html,
  };

  const details = await transporter.sendMail(emailOption);

  console.log("Email sent:", details.messageId);

  return details;
};

export default transporter;