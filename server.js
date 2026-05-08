const fs = require("fs");
const path = require("path");

const envProjectRoot = path.join(__dirname, ".env");

require("dotenv").config({ path: envProjectRoot });
if (!process.env.PORT && fs.existsSync(path.join(process.cwd(), ".env"))) {
  require("dotenv").config({ path: path.join(process.cwd(), ".env") });
}

const app = require("./app/app");

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Subground preview server: http://localhost:${PORT}`);
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
