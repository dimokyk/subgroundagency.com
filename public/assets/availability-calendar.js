(function () {
  const WEEKDAYS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  const WEEKDAYS_SHORT = ["L", "M", "X", "J", "V", "S", "D"];
  const MONTH_FORMATTER = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  });

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function monthToDate(monthKey) {
    const [year, month] = monthKey.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }

  function dateToMonth(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  }

  function shiftMonth(monthKey, delta) {
    const date = monthToDate(monthKey);
    date.setMonth(date.getMonth() + delta);
    return dateToMonth(date);
  }

  function getMonthLabel(monthKey) {
    const label = MONTH_FORMATTER.format(monthToDate(monthKey));
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getStatusClass(status) {
    return `is-${status || "free"}`;
  }

  function shortStatusAbbrev(status) {
    switch (status) {
      case "pending":
        return "Pen";
      case "busy":
        return "Ocu";
      case "free":
      default:
        return "Lib";
    }
  }

  function weekdayOffset(monthKey) {
    const firstDay = monthToDate(monthKey).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
  }

  function createEmptyCells(count) {
    return Array.from({ length: count }, () => {
      return '<div class="availability-day is-empty" aria-hidden="true"></div>';
    }).join("");
  }

  function createDayCells(data) {
    const offset = weekdayOffset(data.month);
    const emptyPrefix = createEmptyCells(offset);
    const dayCells = (data.days || [])
      .map((day) => {
        const safeLabel = escapeHtml(day.label || "Libre");
        const safeShort = escapeHtml(shortStatusAbbrev(day.status));
        return `
          <div class="availability-day ${getStatusClass(day.status)}" aria-label="${escapeHtml(
            `${day.date}: ${safeLabel}`
          )}">
            <div class="availability-day-number">${day.day}</div>
            <div class="availability-day-meta">
              <span class="availability-day-label">
                <span class="availability-day-label-full">${safeLabel}</span>
                <span class="availability-day-label-short" aria-hidden="true">${safeShort}</span>
              </span>
            </div>
          </div>
        `;
      })
      .join("");

    return emptyPrefix + dayCells;
  }

  function createDemoData(month) {
    const date = monthToDate(month);
    const dayCount = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const days = [];

    for (let day = 1; day <= dayCount; day += 1) {
      days.push({
        date: `${month}-${pad(day)}`,
        day,
        status: "free",
        label: "Libre",
      });
    }

    return {
      month,
      days,
    };
  }

  function renderEmpty(root, state, title, message) {
    root.innerHTML = `
      <div class="availability-card">
        <div class="availability-card-head">
          <div>
            <div class="availability-card-kicker">Disponibilidad</div>
            <div class="availability-card-title">${escapeHtml(
              state.artistLabel
            )}</div>
          </div>
          <div class="availability-legend">
            <span class="availability-pill is-free">Libre</span>
            <span class="availability-pill is-pending">Pendiente</span>
            <span class="availability-pill is-busy">Ocupado</span>
          </div>
        </div>
        <div class="availability-empty">
          <strong>${escapeHtml(title)}</strong>
          ${escapeHtml(message)}
        </div>
      </div>
    `;
  }

  function renderCalendar(root, state, data, options = {}) {
    const weekdays = WEEKDAYS.map((day, index) => {
      const short = WEEKDAYS_SHORT[index] || day.charAt(0);
      return `<div class="availability-weekday"><span class="availability-weekday-full">${day}</span><span class="availability-weekday-short" aria-hidden="true">${short}</span></div>`;
    }).join("");

    const demoNote = options.demoMessage
      ? `<div class="availability-demo-note">${escapeHtml(options.demoMessage)}</div>`
      : "";

    root.innerHTML = `
      <div class="availability-card">
        <div class="availability-card-head">
          <div>
            <div class="availability-card-kicker">Disponibilidad</div>
            <div class="availability-card-title">${escapeHtml(
              state.artistLabel
            )}</div>
            <p class="availability-card-copy">Consulta disponibilidad en tiempo real aqui.</p>
          </div>
          <div class="availability-legend">
            <span class="availability-pill is-free">Libre</span>
            <span class="availability-pill is-pending">Pendiente</span>
            <span class="availability-pill is-busy">Ocupado</span>
          </div>
        </div>
        <div class="availability-card-body">
          ${demoNote}
          <div class="availability-toolbar">
            <div class="availability-nav">
              <button type="button" class="availability-nav-btn" data-shift="-1" aria-label="Mes anterior">‹</button>
              <div class="availability-month-label">${escapeHtml(
                getMonthLabel(data.month)
              )}</div>
              <button type="button" class="availability-nav-btn" data-shift="1" aria-label="Mes siguiente">›</button>
            </div>
          </div>
          <div class="availability-grid-scroll">
            <div class="availability-grid">
              <div class="availability-weekdays">${weekdays}</div>
              <div class="availability-days">${createDayCells(data)}</div>
            </div>
          </div>
        </div>
        <div class="availability-card-foot">
          <a class="availability-cta" href="${escapeHtml(
            state.bookingHref
          )}">Consultar Booking</a>
        </div>
      </div>
    `;

    root.querySelectorAll("[data-shift]").forEach((button) => {
      button.addEventListener("click", () => {
        loadMonth(root, state, shiftMonth(data.month, Number(button.dataset.shift)));
      });
    });

    const revealContainer = root.closest(".availability-shell");
    if (revealContainer) {
      revealContainer.classList.add("visible");
    }
  }

  async function fetchMonth(artist, month) {
    const response = await fetch(
      `/api/availability/${encodeURIComponent(artist)}?month=${encodeURIComponent(
        month
      )}`
    );

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const msg =
        payload && typeof payload === "object" && payload.message
          ? payload.message
          : "No se pudo cargar la disponibilidad.";
      throw new Error(msg);
    }

    if (!payload || typeof payload !== "object") {
      throw new Error("No se pudo cargar la disponibilidad.");
    }

    return payload;
  }

  async function loadMonth(root, state, month) {
    renderEmpty(root, state, "Cargando calendario", "Estamos consultando la disponibilidad del artista.");

    try {
      const data = await fetchMonth(state.artist, month);

      if (!data.configured) {
      renderCalendar(root, state, createDemoData(month), {
        demoMessage:
          "Vista previa del diseño. Cuando conectes Google Calendar, aquí aparecerán las fechas reales en libre, pendiente u ocupado.",
      });
      return;
      }

      renderCalendar(root, state, data);
    } catch (error) {
      renderCalendar(root, state, createDemoData(month), {
        demoMessage:
          error.message || "No se pudo cargar la disponibilidad real en este momento.",
      });
    }
  }

  function initCalendar(root) {
    const state = {
      artist: root.dataset.artist,
      artistLabel: root.dataset.artistLabel || root.dataset.artist || "Artista",
      bookingHref: root.dataset.bookingHref || "/#contact",
    };

    const revealContainer = root.closest(".availability-shell");
    if (revealContainer) {
      revealContainer.classList.add("visible");
    }

    if (!state.artist) {
      renderEmpty(root, state, "Configuración incompleta", "Falta indicar qué artista debe cargar este calendario.");
      return;
    }

    loadMonth(root, state, dateToMonth(new Date()));
  }

  function initAllCalendars() {
    document.querySelectorAll(".availability-calendar").forEach(initCalendar);
  }

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initAllCalendars);
  } else {
    initAllCalendars();
  }
})();
