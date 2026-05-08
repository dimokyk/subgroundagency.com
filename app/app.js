const express = require("express");
const path = require("path");
const webRoutes = require("./routes/web");

const app = express();

const repoRoot = path.join(__dirname, "..");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(repoRoot, "public")));
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(repoRoot, "favicon.ico"));
});

app.use("/", webRoutes);

module.exports = app;
