const express = require("express");
const path = require("path");
const webRoutes = require("./routes/web");

const app = express();

const repoRoot = path.join(__dirname, "..");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Repo-root /assets (static hosts publish repo root; public/ is not always at URL /)
app.use("/assets", express.static(path.join(repoRoot, "assets")));
app.use(express.static(path.join(repoRoot, "public")));
app.use("/images", express.static(path.join(repoRoot, "images")));
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(repoRoot, "favicon.ico"));
});

app.use("/", webRoutes);

module.exports = app;
