// utils/email.js
require("dotenv").config();

const sendEmail = async ({ to, subject, html }) => {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Hypnosofa", email: process.env.FROM_EMAIL || "no-reply@hypnosofa.in" },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Brevo Error:", error);
    throw new Error("Email failed");
  }

  console.log("Email sent to:", to);
};

module.exports = { sendEmail };