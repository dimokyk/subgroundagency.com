/**
 * Genera assets/availability-data/bundle.json desde los iCal (variables de entorno).
 * Uso local: npm run sync:availability
 * En CI: secrets ESEE_CALENDAR_ICS_URL, F3LY_CALENDAR_ICS_URL, MEDIOKILO_CALENDAR_ICS_URL
 */
const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(repoRoot, ".env") });
if (fs.existsSync(path.join(process.cwd(), ".env"))) {
  dotenv.config({ path: path.join(process.cwd(), ".env") });
}

const { getArtistAvailability } = require(path.join(
  repoRoot,
  "app",
  "services",
  "availabilityService"
));

const ARTISTS = ["esee", "f3ly", "mediokilo"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function monthKeyUtc(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

function listMonthKeys(monthsBack, monthsForward) {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const keys = [];
  for (let i = -monthsBack; i <= monthsForward; i += 1) {
    const x = new Date(Date.UTC(y, m + i, 1));
    keys.push(monthKeyUtc(x));
  }
  return keys;
}

async function safeGet(artist, month) {
  try {
    const payload = await getArtistAvailability(artist, month);
    if (payload && payload.error) {
      return {
        artist,
        month,
        configured: false,
        updatedAt: new Date().toISOString(),
        days: [],
        syncError: payload.message || payload.error,
      };
    }
    return payload;
  } catch (err) {
    return {
      artist,
      month,
      configured: false,
      updatedAt: new Date().toISOString(),
      days: [],
      syncError: String(err && err.message ? err.message : err),
    };
  }
}

async function main() {
  const months = listMonthKeys(1, 12);
  const artists = {};

  for (const artist of ARTISTS) {
    artists[artist] = {};
    for (const month of months) {
      artists[artist][month] = await safeGet(artist, month);
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    artists,
  };

  const outDir = path.join(repoRoot, "assets", "availability-data");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "bundle.json");
  fs.writeFileSync(outFile, `${JSON.stringify(out)}\n`, "utf8");
  console.log(`Wrote ${outFile} (${months.length} months × ${ARTISTS.length} artists)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
