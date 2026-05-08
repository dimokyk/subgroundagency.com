const express = require("express");
const siteController = require("../controllers/siteController");

const router = express.Router();

router.get("/", siteController.home);
router.get("/artists/f3ly", siteController.f3lyProfile);
router.post("/contact", siteController.sendContactForm);

module.exports = router;
