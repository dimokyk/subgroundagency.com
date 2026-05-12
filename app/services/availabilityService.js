const https = require("https");

const ARTIST_CALENDAR_ENV = {
  f3ly: "F3LY_CALENDAR_ID",
  mediokilo: "MEDIOKILO_CALENDAR_ID",
};

const STATUS_PRIORITY = {
  free: 0,
  pending: 1,
  busy: 2,
};

const STATUS_LABELS = {
  free: "Libre",
  pending: "Pendiente",
  busy: "Ocupado",
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function normalizeArtistKey(artist) {
  return String(artist || "").trim().toLowerCase();
}

function normalizeMonth(monthParam) {
  if (/^\d{4}-\d{2}$/.test(monthParam || "")) {
    const [year, month] = monthParam.split("-").map(Number);
    if (month >= 1 && month <= 12) {
      return { year, monthIndex: month - 1, month: `${year}-${pad(month)}` };
    }
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const monthIndex = now.getUTCMonth();
  return { year, monthIndex, month: `${year}-${pad(monthIndex + 1)}` };
}

function getMonthWindow(monthParam) {
  const normalized = normalizeMonth(monthParam);
  const start = new Date(Date.UTC(normalized.year, normalized.monthIndex, 1));
  const end = new Date(Date.UTC(normalized.year, normalized.monthIndex + 1, 1));
  const dayCount = new Date(
    Date.UTC(normalized.year, normalized.monthIndex + 1, 0)
  ).getUTCDate();

  return {
    ...normalized,
    dayCount,
    start,
    end,
    startKey: `${normalized.month}-01`,
    endKey: `${normalized.month}-${pad(dayCount)}`,
  };
}

function addDays(dateKey, amount) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;
}

function listDateKeys(startKey, endKey) {
  const keys = [];
  for (let current = startKey; current <= endKey; current = addDays(current, 1)) {
    keys.push(current);
  }
  return keys;
}

function inferStatus(summary) {
  const text = String(summary || "").trim().toLowerCase();

  if (!text) {
    return "busy";
  }

  if (
    text.includes("pendiente") ||
    text.includes("pending") ||
    text.includes("tentative") ||
    text.includes("provisional") ||
    text.includes("hold") ||
    text.includes("opcion") ||
    text.includes("opción")
  ) {
    return "pending";
  }

  if (
    text.includes("libre") ||
    text.includes("free") ||
    text.includes("disponible") ||
    text.includes("available")
  ) {
    return "free";
  }

  return "busy";
}

function getEventDateKey(boundary) {
  if (!boundary) return null;
  if (boundary.date) return boundary.date;
  if (boundary.dateTime) return String(boundary.dateTime).slice(0, 10);
  return null;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let raw = "";

        response.on("data", (chunk) => {
          raw += chunk;
        });

        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(
              new Error(`Google Calendar responded with ${response.statusCode}`)
            );
            return;
          }

          try {
            resolve(JSON.parse(raw));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

async function fetchCalendarEvents(calendarId, apiKey, monthWindow) {
  const requestUrl = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events`
  );

  requestUrl.searchParams.set("singleEvents", "true");
  requestUrl.searchParams.set("orderBy", "startTime");
  requestUrl.searchParams.set("timeMin", monthWindow.start.toISOString());
  requestUrl.searchParams.set("timeMax", monthWindow.end.toISOString());
  requestUrl.searchParams.set("maxResults", "2500");
  requestUrl.searchParams.set(
    "fields",
    "items(summary,start(date,dateTime),end(date,dateTime))"
  );
  requestUrl.searchParams.set("key", apiKey);

  const payload = await fetchJson(requestUrl);
  return Array.isArray(payload.items) ? payload.items : [];
}

function applyEventStatuses(events, monthWindow) {
  const statusByDate = new Map();

  for (const event of events) {
    const startKey = getEventDateKey(event.start);
    let endKey = getEventDateKey(event.end);

    if (!startKey || !endKey) {
      continue;
    }

    if (event.end && event.end.date) {
      endKey = addDays(endKey, -1);
    }

    const status = inferStatus(event.summary);

    for (const dateKey of listDateKeys(startKey, endKey)) {
      if (dateKey < monthWindow.startKey || dateKey > monthWindow.endKey) {
        continue;
      }

      const currentStatus = statusByDate.get(dateKey) || "free";
      if (STATUS_PRIORITY[status] > STATUS_PRIORITY[currentStatus]) {
        statusByDate.set(dateKey, status);
      } else if (!statusByDate.has(dateKey)) {
        statusByDate.set(dateKey, currentStatus);
      }
    }
  }

  return statusByDate;
}

async function getArtistAvailability(artist, monthParam) {
  const artistKey = normalizeArtistKey(artist);
  const calendarEnvName = ARTIST_CALENDAR_ENV[artistKey];

  if (!calendarEnvName) {
    return {
      statusCode: 404,
      error: "unknown_artist",
      message: "Artista no disponible para calendario.",
    };
  }

  const monthWindow = getMonthWindow(monthParam);
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  const calendarId = process.env[calendarEnvName];

  if (!apiKey || !calendarId) {
    return {
      artist: artistKey,
      month: monthWindow.month,
      configured: false,
      updatedAt: new Date().toISOString(),
      days: [],
    };
  }

  const events = await fetchCalendarEvents(calendarId, apiKey, monthWindow);
  const statusByDate = applyEventStatuses(events, monthWindow);
  const days = [];

  for (let day = 1; day <= monthWindow.dayCount; day += 1) {
    const date = `${monthWindow.month}-${pad(day)}`;
    const status = statusByDate.get(date) || "free";

    days.push({
      date,
      day,
      status,
      label: STATUS_LABELS[status],
    });
  }

  return {
    artist: artistKey,
    month: monthWindow.month,
    configured: true,
    updatedAt: new Date().toISOString(),
    days,
  };
}

module.exports = {
  getArtistAvailability,
};
