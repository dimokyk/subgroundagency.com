const path = require("path");

const rootDir = path.join(__dirname, "..", "..");

exports.home = (req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
};

exports.f3lyProfile = (req, res) => {
  res.sendFile(path.join(rootDir, "f3ly.html"));
};

exports.mediokiloProfile = (req, res) => {
  res.sendFile(path.join(rootDir, "mediokilo.html"));
};
