
import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!to || !subject || (!text && !html)) {
      throw new Error(
        "Recipient, subject, and email content are required."
      );
    }

    const info = await transporter.sendMail({
      from: `"Perplexity" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("EMAIL ERROR:", error.message);
    console.error("ERROR CODE:", error.code);
    throw error;
  }
};

export default transporter;
