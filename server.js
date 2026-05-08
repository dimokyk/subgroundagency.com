const fs = require("fs");
const path = require("path");

const envProjectRoot = path.join(__dirname, ".env");
const envCwd = path.join(process.cwd(), ".env");

require("dotenv").config({ path: envProjectRoot });
if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.MAIL_TO) {
  require("dotenv").config({ path: envCwd });
}

if (!fs.existsSync(envProjectRoot)) {
  console.warn(`[env] No .env file at ${envProjectRoot} (create one from .env.example)`);
} else if (fs.statSync(envProjectRoot).size === 0) {
  console.warn(
    `[env] ${envProjectRoot} is empty on disk. Save your variables in the editor (Cmd+S) or copy from .env.example`
  );
} else if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.MAIL_TO) {
  console.warn(
    "[env] SMTP_USER, SMTP_PASS or MAIL_TO still missing after loading .env — check variable names and values"
  );
}

const app = require("./app/app");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Subground MVC app running on http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the process using that port or run with another port, e.g. PORT=3001 npm run dev`
    );
    process.exit(1);
  }

  throw error;
});
