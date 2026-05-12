const https = require("https");

const ARTIST_CALENDAR_ENV = {
  esee: "ESEE_CALENDAR_ICS_URL",
  f3ly: "F3LY_CALENDAR_ICS_URL",
  mediokilo: "MEDIOKILO_CALENDAR_ICS_URL",
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

function toDateKey(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )}`;
}

function parseDateOnlyValue(value) {
  if (!/^\d{8}$/.test(value || "")) {
    return null;
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function parseDateTimeValue(value) {
  if (!/^\d{8}T\d{6}Z?$/.test(value || "")) {
    return null;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6)) - 1;
  const day = Number(value.slice(6, 8));
  const hours = Number(value.slice(9, 11));
  const minutes = Number(value.slice(11, 13));
  const seconds = Number(value.slice(13, 15));

  if (value.endsWith("Z")) {
    return toDateKey(new Date(Date.UTC(year, month, day, hours, minutes, seconds)));
  }

  return toDateKey(new Date(Date.UTC(year, month, day, hours, minutes, seconds)));
}

function parseIcsBoundary(propertyName, rawValue) {
  const upperName = String(propertyName || "").toUpperCase();
  const value = String(rawValue || "").trim();
  const isDateOnly = upperName.includes("VALUE=DATE") || /^\d{8}$/.test(value);
  const dateKey = isDateOnly ? parseDateOnlyValue(value) : parseDateTimeValue(value);

  if (!dateKey) {
    return null;
  }

  return {
    date: dateKey,
    isDateOnly,
  };
}

function decodeIcsText(value) {
  return String(value || "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function normalizeIcsUrl(url) {
  if (!url) return "";
  return String(url).trim().replace(/^webcal:\/\//i, "https://");
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let raw = "";

        response.on("data", (chunk) => {
          raw += chunk;
        });

        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`Google Calendar responded with ${response.statusCode}`));
            return;
          }

          resolve(raw);
        });
      })
      .on("error", reject);
  });
}

function parseIcsEvents(icsText) {
  const lines = String(icsText || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");

  const unfolded = [];
  for (const line of lines) {
    if (!line) {
      continue;
    }

    if ((line.startsWith(" ") || line.startsWith("\t")) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
      continue;
    }

    unfolded.push(line);
  }

  const events = [];
  let currentEvent = null;

  for (const line of unfolded) {
    if (line === "BEGIN:VEVENT") {
      currentEvent = {};
      continue;
    }

    if (line === "END:VEVENT") {
      if (currentEvent) {
        events.push(currentEvent);
      }
      currentEvent = null;
      continue;
    }

    if (!currentEvent) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const property = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1);
    const upperProperty = property.toUpperCase();

    if (upperProperty.startsWith("SUMMARY")) {
      currentEvent.summary = decodeIcsText(value);
    } else if (upperProperty.startsWith("DTSTART")) {
      currentEvent.start = parseIcsBoundary(property, value);
    } else if (upperProperty.startsWith("DTEND")) {
      currentEvent.end = parseIcsBoundary(property, value);
    } else if (upperProperty === "STATUS") {
      currentEvent.eventStatus = String(value || "").trim().toUpperCase();
    }
  }

  return events.filter(
    (event) =>
      event.start &&
      event.end &&
      event.eventStatus !== "CANCELLED" &&
      event.eventStatus !== "CANCELED"
  );
}

async function fetchCalendarEvents(icsUrl) {
  const icsText = await fetchText(normalizeIcsUrl(icsUrl));
  return parseIcsEvents(icsText);
}

function applyEventStatuses(events, monthWindow) {
  const statusByDate = new Map();

  for (const event of events) {
    const startKey = event.start && event.start.date;
    let endKey = event.end && event.end.date;

    if (!startKey || !endKey) {
      continue;
    }

    if (event.end && event.end.isDateOnly) {
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
  const icsUrl = process.env[calendarEnvName];

  if (!icsUrl) {
    return {
      artist: artistKey,
      month: monthWindow.month,
      configured: false,
      updatedAt: new Date().toISOString(),
      days: [],
    };
  }

  const events = await fetchCalendarEvents(icsUrl);
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
