const path = require("path");
const nodemailer = require("nodemailer");

const pagesPath = path.join(__dirname, "..", "views", "pages");

function getMailConfig() {
  const pass = process.env.SMTP_PASS ? String(process.env.SMTP_PASS).replace(/\s+/g, "") : "";
  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: (process.env.SMTP_USER || "").trim(),
    pass,
    to: (process.env.MAIL_TO || "").trim(),
  };
}

function createTransporter() {
  const cfg = getMailConfig();
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
  });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

exports.home = (req, res) => {
  res.sendFile(path.join(pagesPath, "index.html"));
};

exports.f3lyProfile = (req, res) => {
  res.sendFile(path.join(pagesPath, "f3ly.html"));
};

exports.sendContactForm = async (req, res) => {
  try {
    const { name, company, email, requestType, message } = req.body;

    if (!name || !email || !requestType || !message) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields.",
      });
    }

    const cfg = getMailConfig();
    if (!cfg.user || !cfg.pass || !cfg.to) {
      console.error("[contact] Missing SMTP_USER, SMTP_PASS or MAIL_TO in .env");
      return res.status(500).json({
        ok: false,
        message: "Email service is not configured.",
      });
    }

    const safeName = escapeHtml(name).slice(0, 200);
    const safeCompany = escapeHtml(company || "-").slice(0, 200);
    const safeEmail = escapeHtml(email).slice(0, 200);
    const safeType = escapeHtml(requestType).slice(0, 100);
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br/>");

    const subject = `[Subground Contact] ${requestType} - ${name}`.slice(0, 200);
    const html = `
      <h2>New booking/contact request</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Club/Promoter/Venue:</strong> ${safeCompany}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Request type:</strong> ${safeType}</p>
      <p><strong>Message:</strong></p>
      <p>${safeMessage}</p>
    `;

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Subground Web Form" <${cfg.user}>`,
      to: cfg.to,
      replyTo: String(email).trim().slice(0, 254),
      subject,
      html,
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("[contact] SMTP error:", error && error.message ? error.message : error);
    if (error && error.response) console.error("[contact]", error.response);
    return res.status(500).json({
      ok: false,
      message: "Unable to send request right now.",
    });
  }
};
