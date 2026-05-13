/**
 * Vercel Serverless: GET /api/availability/:artist?month=YYYY-MM
 * Reusa la misma lógica que Express (iCal secreto vía variables de entorno).
 * En Vercel → Project Settings → Environment Variables:
 *   ESEE_CALENDAR_ICS_URL, F3LY_CALENDAR_ICS_URL, MEDIOKILO_CALENDAR_ICS_URL
 */
const path = require("path");
const availabilityService = require(path.join(
  __dirname,
  "..",
  "..",
  "app",
  "services",
  "availabilityService"
));

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function artistFromReq(req) {
  if (req.query && req.query.artist) {
    return req.query.artist;
  }
  const u = String(req.url || "");
  const m = u.match(/\/api\/availability\/([^/?]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

module.exports = async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  const artist = artistFromReq(req);
  const month = req.query && req.query.month;

  try {
    const payload = await availabilityService.getArtistAvailability(artist, month);

    if (payload.error) {
      res.status(payload.statusCode || 400).json(payload);
      return;
    }

    res.status(200).json(payload);
  } catch (error) {
    console.error("Availability API error:", error);
    res.status(502).json({
      error: "availability_unavailable",
      message: "No se pudo cargar la disponibilidad en este momento.",
    });
  }
};
