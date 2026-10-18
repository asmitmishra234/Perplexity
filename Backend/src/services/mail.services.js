
import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing");
    }

    const sender = "Perplexity <onboarding@resend.dev>";

    if (!to || !subject || (!text && !html)) {
      throw new Error(
        "Recipient, subject, and email content are required."
      );
    }

    console.log("EMAIL TO:", to);

    const { data, error } = await resend.emails.send({
      from: sender,
      to,
      subject,
      text,
      html,
    });

    if (error) {
      console.error("Resend email error:", error);
      throw new Error(error.message || "Email sending failed");
    }

    console.log("Email sent successfully:", data.id);

    return data;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw error;
  }
};

export default resend;
