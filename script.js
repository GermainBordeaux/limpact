/*
  L'IMPACT — script.js
  ----------------------
  Les vidéos sont chargées automatiquement depuis Google Sheets.
  Pour ajouter une vidéo : ajoute simplement une ligne dans le Sheet.
  Plus besoin de toucher au code !
*/

// ── CONFIGURATION ─────────────────────────────
const SHEET_ID   = "1wHAQhye3te3XCLoN5_c1YRecDuYk6ltjdvgb_rs-IPk";
const API_KEY    = "AIzaSyA4_lJfNbkvFkuPIsko-CdqBukVsKaSXfg";
const SHEET_NAME = "Sheet1";
const API_URL    = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;

// ── DONNÉES ────────────────────────────────────
let VIDEOS = [];
let SHORTS = [];

// ── CHARGEMENT DEPUIS GOOGLE SHEETS ───────────
async function loadVideos() {
  try {
    const res  = await fetch(API_URL);
    const data = await res.json();
    const rows = data.values || [];

    // Ligne 1 = en-têtes, on commence à la ligne 2
    const entries = rows.slice(1).map(row => ({
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
    document.getElementById("videoGrid").innerHTML =
      '<div class="empty">Impossible de charger les vidéos. Vérifiez votre connexion.</div>';
  }
}

// ── RENDU VIDÉOS ──────────────────────────────
const $ = s => document.querySelector(s);

function renderVideos(category = "Tous") {
  const grid  = $("#videoGrid");
  const items = category === "Tous"
    ? VIDEOS
    : VIDEOS.filter(v => v.categorie === category);

  if (!items.length) {
    grid.innerHTML = '<div class="empty">Aucune vidéo dans cette catégorie pour le moment.</div>';
    return;
  }

  grid.innerHTML = items.map(v => `
    <article class="video-card" data-id="${v.id}">
      <div class="thumb">
        <div class="play">▶</div>
      </div>
      <div class="card-body">
        <div class="category">${v.categorie}</div>
        <h3>${v.titre}</h3>
        <p>${v.description}</p>
        <div class="card-meta">
          <span>${v.date}</span>
          <span>${v.duree}</span>
        </div>
      </div>
    </article>
  `).join("");

  grid.querySelectorAll(".video-card").forEach(card => {
    card.addEventListener("click", () => openVideo(card.dataset.id));
  });
}

function openVideo(id) {
  const v = VIDEOS.find(x => x.id === id);
  if (!v) return;
  const panel = $("#videoModal .video-panel");
  // Remplace la vidéo par un iframe Videas
  let player = panel.querySelector("iframe.main-player");
  if (!player) {
    panel.querySelector("video") && panel.querySelector("video").remove();
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
  $("#modalCategory").textContent  = v.categorie;
  $("#modalTitle").textContent     = v.titre;
  $("#modalDescription").textContent = v.description;
  $("#videoModal").classList.add("open");
  $("#videoModal").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeVideo() {
  const player = $("#videoModal iframe.main-player");
  if (player) player.src = "";
  $("#videoModal").classList.remove("open");
  $("#videoModal").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// ── RENDU SHORTS ──────────────────────────────
function renderShorts() {
  const track = document.getElementById("shortsTrack");
  if (!track) return;

  if (!SHORTS.length) {
    track.innerHTML = '<div class="empty" style="padding:20px;color:#555;">Aucun short pour le moment.</div>';
    return;
  }

  track.innerHTML = SHORTS.map(s => `
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
  `).join("");

  track.querySelectorAll(".short-card").forEach(card => {
    card.addEventListener("click", () => openShort(card.dataset.shortId));
  });
}

function openShort(id) {
  const s = SHORTS.find(x => x.id === id);
  if (!s) return;
  const iframe = document.getElementById("shortIframe");
  document.getElementById("shortCategory").textContent = s.categorie;
  document.getElementById("shortTitle").textContent    = s.titre;
  document.getElementById("shortDate").textContent     = s.date;
  iframe.src = s.videoUrl;
  document.getElementById("shortModal").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeShort() {
  document.getElementById("shortIframe").src = "";
  document.getElementById("shortModal").classList.remove("open");
  document.body.style.overflow = "";
}

// ── FILTRES ────────────────────────────────────
function setCategory(category) {
  document.querySelectorAll(".filter").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.category === category)
  );
  renderVideos(category);
  location.hash = "actualites";
}

// ── TICKER ─────────────────────────────────────
function renderTicker() {
  const all = [...VIDEOS, ...SHORTS].slice(0, 5);
  const track = $("#tickerTrack");
  if (track) {
    track.innerHTML = all.map(v =>
      `<span><b>${v.categorie}</b> — ${v.titre}</span>`
    ).join("");
  }
}

// ── HERO ───────────────────────────────────────
function renderHero() {
  const first = VIDEOS[0];
  if (!first) return;
  const heroIframe = document.createElement("iframe");
  heroIframe.src = first.videoUrl;
  heroIframe.setAttribute("frameborder", "0");
  heroIframe.setAttribute("allowfullscreen", "true");
  heroIframe.setAttribute("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture");
  heroIframe.setAttribute("referrerpolicy", "unsafe-url");
  heroIframe.style.cssText = "width:100%;height:100%;display:block;border:none;";
  const wrap = $(".hero-video-wrap");
  if (wrap) {
    wrap.innerHTML = "";
    wrap.appendChild(heroIframe);
  }
  const title = $("#heroTitle");
  const desc  = $("#heroDescription");
  if (title) title.textContent = first.titre;
  if (desc)  desc.textContent  = first.description;
}

// ── INIT ───────────────────────────────────────
function init() {
  $("#year") && ($("#year").textContent = new Date().getFullYear());

  renderHero();
  renderVideos();
  renderShorts();
  renderTicker();

  // Filtres catégories
  document.querySelectorAll(".filter").forEach(btn => {
    btn.addEventListener("click", () => setCategory(btn.dataset.category));
  });

  document.querySelectorAll("[data-filter-link]").forEach(link => {
    link.addEventListener("click", () => setCategory(link.dataset.filterLink));
  });

  // Modales
  $("#closeVideo") && $("#closeVideo").addEventListener("click", closeVideo);
  $("#videoModal") && $("#videoModal").addEventListener("click", e => {
    if (e.target === $("#videoModal")) closeVideo();
  });

  $("#closeShort") && $("#closeShort").addEventListener("click", closeShort);
  $("#shortModal") && $("#shortModal").addEventListener("click", e => {
    if (e.target === $("#shortModal")) closeShort();
  });

  // Recherche
  $("#openSearch") && $("#openSearch").addEventListener("click", () => {
    $("#searchModal").classList.add("open");
    $("#searchModal").setAttribute("aria-hidden", "false");
    setTimeout(() => $("#searchInput").focus(), 50);
  });

  function closeSearch() {
    $("#searchModal").classList.remove("open");
    $("#searchModal").setAttribute("aria-hidden", "true");
  }

  $("#closeSearch") && $("#closeSearch").addEventListener("click", closeSearch);
  $("#searchModal") && $("#searchModal").addEventListener("click", e => {
    if (e.target === $("#searchModal")) closeSearch();
  });

  $("#searchInput") && $("#searchInput").addEventListener("input", e => {
    const q   = e.target.value.trim().toLowerCase();
    const all = [...VIDEOS, ...SHORTS];
    const results = q
      ? all.filter(v => `${v.titre} ${v.description} ${v.categorie}`.toLowerCase().includes(q))
      : [];
    $("#searchResults").innerHTML = results.length
      ? results.map(v => `
          <div class="result" data-result-id="${v.id}" data-result-type="${v.type}">
            <small>${v.categorie} — ${v.type === "short" ? "SHORT" : "VIDÉO"}</small>
            <strong>${v.titre}</strong>
          </div>`).join("")
      : (q ? '<div class="empty">Aucun résultat.</div>' : "");

    document.querySelectorAll("[data-result-id]").forEach(item => {
      item.addEventListener("click", () => {
        closeSearch();
        item.dataset.resultType === "short"
          ? openShort(item.dataset.resultId)
          : openVideo(item.dataset.resultId);
      });
    });
  });

  // Menu mobile
  const menuToggle = $(".menu-toggle");
  const nav = $(".main-nav");
  menuToggle && menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
  nav && nav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => nav.classList.remove("open"));
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeVideo(); closeShort(); closeSearch(); }
  });
}

// ── DÉMARRAGE ─────────────────────────────────
document.addEventListener("DOMContentLoaded", loadVideos);
