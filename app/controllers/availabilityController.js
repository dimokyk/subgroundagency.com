const availabilityService = require("../services/availabilityService");

exports.artistAvailability = async (req, res) => {
  try {
    const payload = await availabilityService.getArtistAvailability(
      req.params.artist,
      req.query.month
    );

    if (payload.error) {
      res.status(payload.statusCode || 400).json(payload);
      return;
    }

    res.json(payload);
  } catch (error) {
    console.error("Availability API error:", error);
    res.status(502).json({
      error: "availability_unavailable",
      message: "No se pudo cargar la disponibilidad en este momento.",
    });
  }
};
