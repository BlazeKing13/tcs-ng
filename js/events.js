/* TCS NG — events page logic (dogodki.html) */
(function () {
  "use strict";

  const isEN =
    (document.documentElement.lang || "").toLowerCase().startsWith("en") ||
    window.location.pathname.split("/").includes("en");

  const STR = {
    empty: isEN ? "No events at the moment." : "Trenutno ni objav.",
    actual: isEN ? "CURRENT" : "AKTUALNO",
    readMore: isEN ? "Read more" : "Preberi več",
    loadErr: isEN
      ? "Could not load events. Make sure <strong>events.json</strong> is available and you’re serving the site over <strong>http</strong>."
      : "Ni mogoče naložiti dogodkov. Preveri, če je <strong>events.json</strong> v isti mapi kot HTML\n          in da stran odpiraš prek <strong>http</strong> (GitHub Pages).",
  };

  const LOCALE = isEN ? "en-GB" : "sl-SI";
  const ASSET_BASE = isEN ? ".." : ".";
  const DATA_URL = isEN ? "../events_en.json" : "./events.json";

  const eventsContainer = document.getElementById("events");
  const pastEventsContainer = document.getElementById("pastEvents");
  if (!eventsContainer) return;

  function escapeHTML(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toTime(obj) {
    const d = obj?.date;
    if (!d) return 0;
    const t = Date.parse(d);
    return Number.isFinite(t) ? t : 0;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(LOCALE, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  function normalizeAsset(path) {
    const p = String(path || "");
    if (!p) return p;
    if (p.startsWith("./")) return `${ASSET_BASE}/${p.slice(2)}`;
    return p;
  }

function longToHTML(text) {
  const raw = String(text ?? "");
  if (!raw.trim()) return "";
  return marked.parse(raw);
}

  function renderEvents(list, container) {
    if (!container) return;
    container.innerHTML = "";

    if (!list.length) {
      container.innerHTML = `
        <div style="text-align:center; color: var(--muted); padding: 18px 0;">
          ${STR.empty}
        </div>
      `;
      return;
    }

    list.forEach((ev, index) => {
      const article = document.createElement("article");
      const actual = !!ev.actual;
      article.className = actual ? "event actual" : "event";

      const title = escapeHTML(ev.title);
      const date = formatDate(ev.date);
      const flyer = escapeHTML(
        normalizeAsset(ev.flyer || ev.image || "./images/TCS.jpg"),
      );
      const alt = escapeHTML(ev.alt || ev.title || (isEN ? "Event" : "Dogodek"));
      const short = ev.short ? marked.parse(ev.short) : "";

      article.innerHTML = `
        <div class="event-flyer">
          <img src="${flyer}" alt="${alt}" loading="lazy" decoding="async" />
        </div>

        <div class="event-title-row">
          <h3 class="event-title">${title}</h3>
          <div class="event-date">${escapeHTML(date)}</div>
        </div>

        ${actual ? `<div class="badge-actual">${STR.actual}</div>` : ""}
        ${short ? `<p class="event-short">${short}</p>` : ""}

        <details>
          <summary>
            <span class="readmore">${STR.readMore} <span class="chev">▾</span></span>
          </summary>
          <div class="more">
            ${longToHTML(ev.long)}
          </div>
        </details>
      `;

      container.appendChild(article);
      setTimeout(() => article.classList.add("visible"), index * 90);
    });
  }

  async function loadEvents() {
    try {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("Cannot read events data");
      const data = await res.json();
      const cachedEvents = Array.isArray(data) ? data : [];

      const upcomingPinned = cachedEvents.filter((e) => !e.past && !!e.actual);
      const upcomingNormal = cachedEvents.filter((e) => !e.past && !e.actual);
      const pastTagged = cachedEvents.filter((e) => !!e.past);

      upcomingPinned.sort((a, b) => toTime(a) - toTime(b));
      upcomingNormal.sort((a, b) => toTime(a) - toTime(b));
      pastTagged.sort((a, b) => toTime(b) - toTime(a));

      renderEvents([...upcomingPinned, ...upcomingNormal], eventsContainer);
      renderEvents(pastTagged, pastEventsContainer);
    } catch (err) {
      eventsContainer.innerHTML = `
        <div style="text-align:center; color: var(--muted); padding: 18px 0;">
          ${STR.loadErr}
        </div>
      `;
      console.error(err);
    }
  }

  document.addEventListener("DOMContentLoaded", loadEvents);
})();
