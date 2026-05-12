const express = require("express");
const siteController = require("../controllers/siteController");
const availabilityController = require("../controllers/availabilityController");

const router = express.Router();

router.get("/", siteController.home);
router.get("/f3ly.html", siteController.f3lyProfile);
router.get("/artists/f3ly", siteController.f3lyProfile);
router.get("/mediokilo.html", siteController.mediokiloProfile);
router.get("/artists/mediokilo", siteController.mediokiloProfile);
router.get("/esee.html", siteController.eseeProfile);
router.get("/artists/esee", siteController.eseeProfile);
router.get(
  "/api/availability/:artist",
  availabilityController.artistAvailability
);

module.exports = router;
