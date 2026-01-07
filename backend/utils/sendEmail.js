import nodemailer from "nodemailer";
import Settings from "../models/Settings.js";
import { decrypt } from "../controllers/emailController.js";

const sendEmail = async (options) => {
  // Fetch settings from DB
  const settings = await Settings.findOne();

  if (!settings || !settings.smtp_settings || !settings.smtp_settings.host) {
    throw new Error("SMTP Settings not configured in database");
  }

  const { host, port, user, pass, secure } = settings.smtp_settings;

  // Decrypt password
  const decryptedPass = decrypt(pass);

  // Create transporter
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: secure, // true for 465, false for other ports
    auth: {
      user,
      pass: decryptedPass,
    },
  });

  const fromName = settings.company_details?.name || "Support";
  const fromEmail = user; // Use SMTP user as sender

  // Define email options
  const message = {
    from: `"${fromName}" <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    html: options.message, // Using HTML for better formatting
    attachments: options.attachments, // Add attachments support
  };

  // Send email
  const info = await transporter.sendMail(message);

  console.log("Message sent: %s", info.messageId);
};

export default sendEmail;
