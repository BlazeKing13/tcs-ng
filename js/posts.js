/* TCS NG — posts page logic (tedenske-novice.html) */
(function () {
  "use strict";

  const isEN =
    (document.documentElement.lang || "").toLowerCase().startsWith("en") ||
    window.location.pathname.split("/").includes("en");

  const STR = {
    empty: isEN ? "No posts at the moment." : "Trenutno ni objav.",
    important: isEN ? "IMPORTANT" : "POMEMBNO",
    readMore: isEN ? "Read more" : "Preberi več",
    loadErr: isEN
      ? "Could not load posts. Make sure <strong>posts.json</strong> is available and you’re serving the site over <strong>http</strong>."
      : "Ni mogoče naložiti objav. Preveri, če je <strong>posts.json</strong> v isti mapi kot HTML\n          in da stran odpiraš prek <strong>http</strong> (GitHub Pages).",
  };

  const LOCALE = isEN ? "en-GB" : "sl-SI";
  const ASSET_BASE = isEN ? ".." : ".";
  const DATA_URL = isEN ? "../posts_en.json" : "./posts.json";

  const postsContainer = document.getElementById("posts");
  if (!postsContainer) return;

  const searchInput = document.getElementById("search");
  const sortSelect = document.getElementById("sort");

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

  function renderPosts(list) {
    postsContainer.innerHTML = "";
    if (!list.length) {
      postsContainer.innerHTML = `
        <div style="text-align:center; color: var(--muted); padding: 18px 0;">
          ${STR.empty}
        </div>
      `;
      return;
    }

    list.forEach((post, index) => {
      const article = document.createElement("article");
      const important = !!post.important;
      article.className = important ? "post important" : "post";

      const title = escapeHTML(post.title);
      const date = formatDate(post.date);
      const short = post.short ? marked.parse(post.short) : "";
      const img = escapeHTML(
        normalizeAsset(post.image || post.img || "./images/TCS.jpg"),
      );
      const alt = escapeHTML(post.alt || post.title || (isEN ? "News" : "Novica"));

      article.innerHTML = `
        <div class="post-grid">
          <div class="post-img">
            <img src="${img}" alt="${alt}" loading="lazy" decoding="async" />
          </div>

          <div>
            <div class="post-title-row">
              <h3 class="post-title">${title}</h3>
              <div class="post-date">${escapeHTML(date)}</div>
            </div>

            ${important ? `<div class="badge">${STR.important}</div>` : ""}

            <p class="post-short">${short}</p>

            <details>
              <summary>
                <span class="readmore">${STR.readMore} <span class="chev">▾</span></span>
              </summary>
              <div class="more">
                ${longToHTML(post.long)}
              </div>
            </details>
          </div>
        </div>
      `;

      postsContainer.appendChild(article);
      setTimeout(() => article.classList.add("visible"), index * 90);
    });
  }

  function sortWithPin(list, mode) {
    const pinned = list.filter((p) => !!p.important);
    const rest = list.filter((p) => !p.important);

    const asc = (a, b) => toTime(a) - toTime(b);
    const desc = (a, b) => toTime(b) - toTime(a);

    if (mode === "oldest") {
      pinned.sort(asc);
      rest.sort(asc);
    } else {
      pinned.sort(desc);
      rest.sort(desc);
    }
    return [...pinned, ...rest];
  }

  let cachedPosts = [];

  function applyFilters() {
    const q = (searchInput?.value || "").trim().toLowerCase();
    const mode = sortSelect?.value || "newest";

    let list = [...cachedPosts];

    if (q) {
      list = list.filter((p) => {
        const hay = `${p.title || ""} ${p.short || ""} ${p.long || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }

    renderPosts(sortWithPin(list, mode));
  }

  async function loadPosts() {
    try {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("Cannot read posts data");
      const data = await res.json();
      cachedPosts = Array.isArray(data) ? data : [];

      // default sort: newest + pin
      renderPosts(sortWithPin([...cachedPosts], sortSelect?.value || "newest"));
    } catch (err) {
      postsContainer.innerHTML = `
        <div style="text-align:center; color: var(--muted); padding: 18px 0;">
          ${STR.loadErr}
        </div>
      `;
      console.error(err);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    searchInput?.addEventListener("input", applyFilters);
    sortSelect?.addEventListener("change", applyFilters);
    loadPosts();
  });
})();
