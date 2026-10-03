const $ = (s) => document.querySelector(s);
$("#year").textContent = new Date().getFullYear();
$("#ig").href = TEAM.instagram;
$("#mail").href = "mailto:" + TEAM.email;
$("#wa").href = "https://wa.me/" + TEAM.whatsapp;
$("#burger").onclick = () => $("#menu").classList.toggle("open");
$("#menu").addEventListener("click", () => $("#menu").classList.remove("open"));

const fotoHtml = (g, i) => `<div class="gitem" data-i="${i}"><img src="assets/${g.src}" alt="Foto del equipo" loading="lazy"></div>`;
const videoHtml = (g, i) => `<div class="gitem video" data-i="${i}"><img src="assets/${g.poster}" alt="Video del torneo" loading="lazy"><span class="play">▶</span></div>`;

let torneo = null, filtro = "todo";
let lista = [];                 // lo que se ve con el torneo y filtro actuales (el visor navega esta lista)
function pintar() {
  lista = GALERIA.filter((g) => (g.torneo || "primavera") === torneo && (filtro === "todo" || g.tipo === filtro || g.dia === filtro));
  const fotos = [], videos = [];
  lista.forEach((g, i) => (g.tipo === "video" ? videos : fotos).push([g, i]));
  $("#gallery").innerHTML = fotos.map(([g, i]) => fotoHtml(g, i)).join("");
  $("#vslider").innerHTML = videos.map(([g, i]) => videoHtml(g, i)).join("");
  $("#fotos-block").hidden = !fotos.length;
  $("#videos-block").hidden = !videos.length;
  $("#n-fotos").textContent = fotos.length ? `(${fotos.length})` : "";
  $("#n-videos").textContent = videos.length ? `(${videos.length})` : "";
  $("#vslider").scrollLeft = 0;
}
function abrirTorneo(id) {
  const t = GALERIA_TORNEOS.find((x) => x.id === id); if (!t) return volver();
  torneo = id; filtro = "todo";
  document.querySelectorAll(".chip[data-f]").forEach((c) => c.classList.toggle("on", c.dataset.f === "todo"));
  $("#t-titulo").textContent = t.nombre;
  $("#t-sub").textContent = `${t.lugar} · ${t.fecha}${t.logro ? " · " + t.logro : ""}`;
  $("#torneos-view").hidden = true; $("#torneo-view").hidden = false;
  history.replaceState(null, "", "#" + id);
  pintar(); scrollTo(0, 0);
}
function volver() {
  torneo = null;
  $("#torneo-view").hidden = true; $("#torneos-view").hidden = false;
  history.replaceState(null, "", location.pathname);
}
$("#tcards").innerHTML = GALERIA_TORNEOS.map((t) => {
  const n = GALERIA.filter((g) => (g.torneo || "primavera") === t.id);
  return `<button class="tcard" data-t="${t.id}"><img src="assets/${t.portada}" alt="" loading="lazy">
    <div><b>${t.nombre}</b><small>${t.lugar} · ${t.fecha}</small>
    <small>${n.filter((g) => g.tipo === "foto").length} fotos · ${n.filter((g) => g.tipo === "video").length} videos</small></div></button>`;
}).join("");
$("#tcards").addEventListener("click", (e) => { const c = e.target.closest(".tcard"); if (c) abrirTorneo(c.dataset.t); });
$("#back").onclick = volver;
$("#filters").addEventListener("click", (e) => {
  const b = e.target.closest(".chip"); if (!b) return;
  document.querySelectorAll(".chip[data-f]").forEach((c) => c.classList.toggle("on", c === b));
  filtro = b.dataset.f; pintar();
});
const vs = $("#vslider");
$("#v-prev").onclick = () => vs.scrollBy({ left: -vs.clientWidth, behavior: "smooth" });
$("#v-next").onclick = () => vs.scrollBy({ left: vs.clientWidth, behavior: "smooth" });
if (location.hash.length > 1) abrirTorneo(location.hash.slice(1));

// Visor con flechas
const lb = $("#lb"), lbImg = lb.querySelector("img"), lbVid = lb.querySelector("video");
let cur = 0;
function mostrar(i) {
  lb.classList.remove("solo");
  cur = (i + lista.length) % lista.length;
  const g = lista[cur], v = g.tipo === "video";
  lbVid.pause();
  lbImg.style.display = v ? "none" : ""; lbVid.style.display = v ? "" : "none";
  if (v) { lbVid.src = "assets/" + g.src; lbVid.play().catch(() => {}); }
  else { lbVid.removeAttribute("src"); lbImg.src = "assets/" + g.src; }
  lb.querySelector(".count-lb").textContent = `${cur + 1} / ${lista.length}`;
  lb.classList.add("open");
}
const cerrar = () => { lb.classList.remove("open", "solo"); lbVid.pause(); lbVid.removeAttribute("src"); };
const abrirItem = (e) => { const it = e.target.closest(".gitem"); if (it) mostrar(+it.dataset.i); };
$("#gallery").addEventListener("click", abrirItem);
$("#vslider").addEventListener("click", abrirItem);
lb.querySelector(".prev").onclick = (e) => { e.stopPropagation(); mostrar(cur - 1); };
lb.querySelector(".next-btn").onclick = (e) => { e.stopPropagation(); mostrar(cur + 1); };
lb.querySelector(".close").onclick = cerrar;
lb.addEventListener("click", (e) => { if (e.target === lb) cerrar(); });
// En el celular: deslizar a los costados cambia de foto, deslizar hacia abajo cierra
let toque = null;
lb.addEventListener("touchstart", (e) => { toque = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
lb.addEventListener("touchend", (e) => {
  if (!toque) return;
  const dx = e.changedTouches[0].clientX - toque.x, dy = e.changedTouches[0].clientY - toque.y;
  toque = null;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && !lb.classList.contains("solo")) mostrar(cur + (dx < 0 ? 1 : -1));
  else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) cerrar();
});
document.addEventListener("keydown", (e) => {
  if (!lb.classList.contains("open")) return;
  if (e.key === "Escape") cerrar();
  if (e.key === "ArrowLeft") mostrar(cur - 1);
  if (e.key === "ArrowRight") mostrar(cur + 1);
});

// Zoom de uniformes (sin flechas de la galería)
$("#uniforms").addEventListener("click", (e) => {
  const img = e.target.closest("img"); if (!img) return;
  lbVid.pause(); lbVid.style.display = "none"; lbImg.style.display = ""; lbImg.src = img.src;
  lb.classList.add("open", "solo");
});
