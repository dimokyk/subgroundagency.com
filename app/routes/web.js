const express = require("express");
const siteController = require("../controllers/siteController");

const router = express.Router();

router.get("/", siteController.home);
router.get("/f3ly.html", siteController.f3lyProfile);
router.get("/artists/f3ly", siteController.f3lyProfile);

module.exports = router;
