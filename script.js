/*
  L'IMPACT — script.js
  Les vidéos sont chargées depuis Google Sheets.
  Les sources pointent vers Google Drive.
*/

// ── CONFIG ────────────────────────────────────
const SHEET_ID   = "1wHAQhye3te3XCLoN5_c1YRecDuYk6ltjdvgb_rs-IPk";
const API_KEY    = "AIzaSyA4_lJfNbkvFkuPIsko-CdqBukVsKaSXfg";
const SHEET_NAME = "Sheet1";
const DRIVE_URL  = "https://drive.google.com/drive/folders/19zVl8f3BxJueVnXfVBRnoqrv6gTneYmQ";

let VIDEOS = [];
let SHORTS = [];

// ── CHARGEMENT SHEETS ─────────────────────────
async function loadVideos() {
  try {
    const url  = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
    const res  = await fetch(url);
    const data = await res.json();
    const rows = (data.values || []).slice(1);

    const entries = rows.map(row => ({
      id:          row[0] || "",
      titre:       row[1] || "",
      description: row[2] || "",
      categorie:   row[3] || "",
      date:        row[4] || "",
      duree:       row[5] || "—",
      type:        (row[6] || "video").toLowerCase(),
      videoUrl:    row[7] || ""
    })).filter(v => v.titre && v.videoUrl);

    VIDEOS = entries.filter(v => v.type === "video");
    SHORTS = entries.filter(v => v.type === "short");

    init();
  } catch (err) {
    console.error("Erreur chargement vidéos :", err);
  }
}

// ── SÉLECTEUR ─────────────────────────────────
const $ = s => document.querySelector(s);

// ── VIDÉOS ────────────────────────────────────
function renderVideos(category) {
  const grid  = $("#videoGrid");
  if (!grid) return;
  const items = !category || category === "Tous"
    ? VIDEOS
    : VIDEOS.filter(v => v.categorie === category);

  grid.innerHTML = items.length ? items.map(v => `
    <article class="video-card" data-id="${v.id}">
      <div class="thumb"><div class="play">▶</div></div>
      <div class="card-body">
        <div class="category">${v.categorie}</div>
        <h3>${v.titre}</h3>
        <p>${v.description}</p>
        <div class="card-meta"><span>${v.date}</span><span>${v.duree}</span></div>
      </div>
    </article>
  `).join("") : '<div class="empty">Aucune vidéo dans cette catégorie.</div>';

  grid.querySelectorAll(".video-card").forEach(card => {
    card.addEventListener("click", () => openVideo(card.dataset.id));
  });
}

function openVideo(id) {
  const v = VIDEOS.find(x => x.id === id);
  if (!v) return;
  const panel = $("#videoModal .video-panel");
  let player = panel.querySelector("iframe.main-player");
  if (!player) {
    player = document.createElement("iframe");
    player.className = "main-player";
    player.setAttribute("frameborder", "0");
    player.setAttribute("allowfullscreen", "true");
    player.setAttribute("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture");
    player.setAttribute("referrerpolicy", "unsafe-url");
    player.style.cssText = "width:100%;aspect-ratio:16/9;display:block;background:#000;max-height:70vh;";
    panel.insertBefore(player, panel.querySelector(".modal-info"));
  }
  player.src = v.videoUrl;
  $("#modalCategory").textContent    = v.categorie;
  $("#modalTitle").textContent       = v.titre;
  $("#modalDescription").textContent = v.description;
  $("#videoModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeVideo() {
  const player = $("#videoModal iframe.main-player");
  if (player) player.src = "";
  $("#videoModal").classList.remove("open");
  document.body.style.overflow = "";
}

// ── SHORTS ────────────────────────────────────
function renderShorts() {
  const track = document.getElementById("shortsTrack");
  if (!track) return;
  track.innerHTML = SHORTS.length ? SHORTS.map(s => `
    <div class="short-card" data-short-id="${s.id}">
      <div class="short-thumb">
        <div class="short-play">▶</div>
        <div class="short-dur">${s.duree}</div>
      </div>
      <div class="short-body">
        <div class="category">${s.categorie}</div>
        <h3>${s.titre}</h3>
      </div>
    </div>
  `).join("") : '<div class="empty" style="padding:20px;color:#555;">Aucun short pour le moment.</div>';

  track.querySelectorAll(".short-card").forEach(card => {
    card.addEventListener("click", () => openShort(card.dataset.shortId));
  });
}

function openShort(id) {
  const s = SHORTS.find(x => x.id === id);
  if (!s) return;
  document.getElementById("shortIframe").src      = s.videoUrl;
  document.getElementById("shortCategory").textContent = s.categorie;
  document.getElementById("shortTitle").textContent    = s.titre;
  document.getElementById("shortDate").textContent     = s.date;
  document.getElementById("shortModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeShort() {
  document.getElementById("shortIframe").src = "";
  document.getElementById("shortModal").classList.remove("open");
  document.body.style.overflow = "";
}

// ── DRIVE ─────────────────────────────────────
function loadDrive() {
  const browser = document.getElementById("driveBrowser");
  if (!browser) return;
  browser.innerHTML = `
    <div class="drive-link-box">
      <div class="drive-link-icon">📁</div>
      <div class="drive-link-text">
        <strong>Archives L'Impact</strong>
        <p>Rushs, scripts, documents de travail — tous les fichiers sources sont accessibles librement.</p>
      </div>
      <a class="btn btn-primary" href="${DRIVE_URL}" target="_blank" rel="noopener">Ouvrir le Drive ↗</a>
    </div>
  `;
}

// ── FILTRES ───────────────────────────────────
function setCategory(category) {
  document.querySelectorAll(".filter").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.category === category)
  );
  renderVideos(category);
  location.hash = "actualites";
}

// ── TICKER ────────────────────────────────────
function renderTicker() {
  const track = $("#tickerTrack");
  if (!track) return;
  const all = [...VIDEOS, ...SHORTS].slice(0, 5);
  track.innerHTML = all.map(v => `<span><b>${v.categorie}</b> — ${v.titre}</span>`).join("");
}

// ── HERO ──────────────────────────────────────
function renderHero() {
  const first = VIDEOS[0];
  if (!first) return;
  const wrap = $(".hero-video-wrap");
  if (wrap) {
    const iframe = document.createElement("iframe");
    iframe.src = first.videoUrl;
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture");
    iframe.setAttribute("referrerpolicy", "unsafe-url");
    iframe.style.cssText = "width:100%;height:100%;display:block;border:none;";
    wrap.innerHTML = "";
    wrap.appendChild(iframe);
  }
  const title = $("#heroTitle");
  const desc  = $("#heroDescription");
  if (title) title.textContent = first.titre;
  if (desc)  desc.textContent  = first.description;
}

// ── RECHERCHE ─────────────────────────────────
function initSearch() {
  function closeSearch() {
    $("#searchModal").classList.remove("open");
  }
  $("#openSearch") && $("#openSearch").addEventListener("click", () => {
    $("#searchModal").classList.add("open");
    setTimeout(() => $("#searchInput").focus(), 50);
  });
  $("#closeSearch") && $("#closeSearch").addEventListener("click", closeSearch);
  $("#searchModal") && $("#searchModal").addEventListener("click", e => {
    if (e.target === $("#searchModal")) closeSearch();
  });
  $("#searchInput") && $("#searchInput").addEventListener("input", e => {
    const q   = e.target.value.trim().toLowerCase();
    const all = [...VIDEOS, ...SHORTS];
    const results = q ? all.filter(v =>
      `${v.titre} ${v.description} ${v.categorie}`.toLowerCase().includes(q)
    ) : [];
    $("#searchResults").innerHTML = results.map(v => `
      <div class="result" data-result-id="${v.id}" data-result-type="${v.type}">
        <small>${v.categorie} — ${v.type === "short" ? "SHORT" : "VIDÉO"}</small>
        <strong>${v.titre}</strong>
      </div>`).join("") || (q ? '<div class="empty">Aucun résultat.</div>' : "");
    document.querySelectorAll("[data-result-id]").forEach(item => {
      item.addEventListener("click", () => {
        closeSearch();
        item.dataset.resultType === "short"
          ? openShort(item.dataset.resultId)
          : openVideo(item.dataset.resultId);
      });
    });
  });
}

// ── INIT ──────────────────────────────────────
function init() {
  if ($("#year")) $("#year").textContent = new Date().getFullYear();

  renderHero();
  renderVideos();
  renderShorts();
  renderTicker();
  loadDrive();

  document.querySelectorAll(".filter").forEach(btn => {
    btn.addEventListener("click", () => setCategory(btn.dataset.category));
  });
  document.querySelectorAll("[data-filter-link]").forEach(link => {
    link.addEventListener("click", () => setCategory(link.dataset.filterLink));
  });

  $("#closeVideo") && $("#closeVideo").addEventListener("click", closeVideo);
  $("#videoModal") && $("#videoModal").addEventListener("click", e => {
    if (e.target === $("#videoModal")) closeVideo();
  });

  $("#closeShort") && $("#closeShort").addEventListener("click", closeShort);
  $("#shortModal") && $("#shortModal").addEventListener("click", e => {
    if (e.target === $("#shortModal")) closeShort();
  });

  const menuToggle = $(".menu-toggle");
  const nav = $(".main-nav");
  menuToggle && menuToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
  nav && nav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => nav.classList.remove("open"));
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeVideo(); closeShort(); }
  });

  initSearch();
}

// ── DÉMARRAGE ─────────────────────────────────
document.addEventListener("DOMContentLoaded", loadVideos);
