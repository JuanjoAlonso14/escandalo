const $ = (s) => document.querySelector(s);
$("#year").textContent = new Date().getFullYear();
$("#ig").href = TEAM.instagram;
$("#mail").href = "mailto:" + TEAM.email;
$("#burger").onclick = () => $("#menu").classList.toggle("open");
$("#menu").addEventListener("click", () => $("#menu").classList.remove("open"));

const fotoHtml = (g, i) => `<div class="gitem" data-i="${i}"><img src="assets/${escHtml(g.src)}" alt="Foto de Escándalo Ultimate en ${escHtml(GALERIA_TORNEOS.find((t) => t.id === torneo)?.nombre || "un torneo")}" loading="lazy"></div>`;
const videoHtml = (g, i) => `<div class="gitem video" data-i="${i}"><img src="assets/${escHtml(g.poster)}" alt="Video de Escándalo Ultimate en ${escHtml(GALERIA_TORNEOS.find((t) => t.id === torneo)?.nombre || "un torneo")}" loading="lazy"><span class="play">▶</span></div>`;

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
  $("#t-sub").innerHTML = `${escHtml(t.lugar)} · ${escHtml(t.fecha)}${t.logro ? " · " + conIconos(t.logro) : ""}`;
  $("#t-resumen").href = "/torneo#" + id;
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
  return `<button class="tcard" data-t="${escHtml(t.id)}"><img src="assets/${escHtml(t.portada)}" alt="" loading="lazy">
    <div><b>${escHtml(t.nombre)}</b><small>${escHtml(t.lugar)} · ${escHtml(t.fecha)}</small>
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

// Uniformes con candado (sin sesión). Con sesión se ven siempre, sin contraseña.
const HASH_UNIFORMES = "107b42b9255bada2509d9742387eda2a76270b22073b733dab292355d436dd7f";
const uniWrap = $("#uni-wrap");
async function sha256(texto) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function desbloquearUniformes(animar) {
  uniWrap.classList.remove("bloqueado");
  if (animar) uniWrap.classList.add("revela");
  uniWrap.querySelectorAll("[data-src]").forEach((el) => {
    if (el.tagName === "VIDEO") { el.removeAttribute("poster"); el.preload = "metadata"; }
    el.src = el.dataset.src;
  });
}
const logueado = !!document.documentElement.dataset.cuenta || !!(typeof Sesion !== "undefined" && Sesion.actual && Sesion.actual());
if (logueado) {
  desbloquearUniformes(false);
} else {
  try { if (localStorage.getItem("uniformes-ok") === "1") desbloquearUniformes(false); } catch (e) {}
  (function cablearOjito(wrap) {
    if (!wrap) return;
    const input = wrap.querySelector("input"), btn = wrap.querySelector(".clave-ojito");
    const pintar = () => {
      const ver = input.type === "text";
      btn.innerHTML = ico(ver ? "ojo-off" : "ojo");
      btn.setAttribute("aria-label", ver ? "Ocultar contraseña" : "Mostrar contraseña");
    };
    pintar();
    btn.addEventListener("click", () => { input.type = input.type === "password" ? "text" : "password"; pintar(); });
  })($("#uni-candado .clave-wrap"));
  $("#uni-candado").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget, clave = $("#uni-clave").value.trim().toLowerCase();
    const ok = clave && window.crypto && crypto.subtle && (await sha256(clave)) === HASH_UNIFORMES;
    if (ok) {
      try { localStorage.setItem("uniformes-ok", "1"); } catch (err) {}
      desbloquearUniformes(true);
    } else {
      $("#uni-error").textContent = "Contraseña incorrecta. ¿Seguro que sos campeón?";
      form.classList.remove("mal"); void form.offsetWidth; form.classList.add("mal");
      $("#uni-clave").select();
    }
  });
}
