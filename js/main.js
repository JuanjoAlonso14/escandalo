// Video de fondo de la portada: tríptico horizontal en pantallas anchas, una columna en celular.
// No se carga con "reducir movimiento" ni con ahorro de datos (queda la primera imagen fija).
const heroVid = document.querySelector(".hero-video");
if (heroVid) {
  const base = "assets/portada/portada" + (matchMedia("(max-aspect-ratio: 1/1)").matches ? "-movil" : "");
  heroVid.poster = base + ".webp";
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches || navigator.connection?.saveData;
  if (!quieto) { heroVid.src = base + ".mp4"; heroVid.play().catch(() => {}); }
}

// Explosión de entrada. Corre al cargar el inicio y cada vez que se toca "Inicio" (se omite con "reducir movimiento").
function explotar() {
  document.querySelector(".boom")?.remove();
  const boom = document.createElement("div");
  boom.className = "boom";
  boom.setAttribute("aria-hidden", "true");
  boom.innerHTML = '<b class="whiteout"></b><b class="flash"></b><b class="ring"></b><b class="ring r2"></b><b class="ring r3"></b>';
  const colores = ["#ffb81c", "#b44cff", "#ff7a1c", "#31c4ff", "#ffffff", "#ff3fa4"];
  const R = Math.hypot(innerWidth, innerHeight) / 2;     // del centro a la esquina
  for (let i = 0; i < 70; i++) {
    const a = (i / 70) * Math.PI * 2 + Math.random() * 0.4, d = R * (0.35 + Math.random() * 0.8);
    const s = document.createElement("i");
    s.style.setProperty("--dx", Math.cos(a) * d + "px");
    s.style.setProperty("--dy", Math.sin(a) * d + "px");
    s.style.setProperty("--c", colores[i % colores.length]);
    s.style.setProperty("--s", 6 + Math.random() * 12 + "px");
    boom.appendChild(s);
  }
  document.body.prepend(boom);
  const hero = document.querySelector(".hero");     // reinicia la entrada del logo, texto y botones
  hero.classList.remove("entrada"); void hero.offsetWidth; hero.classList.add("entrada");
  setTimeout(() => boom.remove(), 2200);
}
// Al cargar, solo explota si se entra arriba del inicio: no con un link a una sección (/#plantel)
// ni al recargar o volver atrás estando más abajo (el navegador restaura esa posición).
let scrollPrevio = 0;
try { scrollPrevio = +sessionStorage.getItem("scrollInicio") || 0; } catch (e) {}
addEventListener("pagehide", () => { try { sessionStorage.setItem("scrollInicio", scrollY); } catch (e) {} });
const tipoCarga = performance.getEntriesByType("navigation")[0]?.type;
const vuelveAbajo = tipoCarga && tipoCarga !== "navigate" && scrollPrevio > innerHeight / 2;
if (!location.hash && !vuelveAbajo) explotar();

document.querySelectorAll('a[href="/"]').forEach((a) => a.addEventListener("click", (e) => {
  e.preventDefault();
  scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", "/");
  explotar();
}));

const $ = (s) => document.querySelector(s);
const MESES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
const toDate = (s) => new Date(s.includes(" ") ? s.replace(" ", "T") : s + "T00:00");
const parts = (d) => ({ d: d.getDate(), m: MESES[d.getMonth()] });
const hora = (d) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

// Textos generales
$("#year").textContent = new Date().getFullYear();
$("#ig").href = TEAM.instagram;
$("#mail").href = "mailto:" + TEAM.email;
$("#wa").href = "https://wa.me/" + TEAM.whatsapp;

// Estadísticas
const esV = (r) => r.resultado ? r.resultado === "V" : r.nuestros > r.suyos;
const esD = (r) => r.resultado ? r.resultado === "D" : r.nuestros < r.suyos;
const gan = RESULTADOS.filter(esV).length;
const stats = { "#st-jug": [JUGADORES.length, ""], "#st-gan": [gan, ""], "#st-par": [RESULTADOS.length, ""],
  "#st-pct": [RESULTADOS.length ? Math.round((gan / RESULTADOS.length) * 100) : null, "%"] };
// Los números cuentan desde 0 cuando la franja aparece en pantalla
function contar() {
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches, t0 = performance.now(), dur = 1600;
  const paso = (t) => {
    const p = quieto ? 1 : Math.min(1, (t - t0) / dur), suave = 1 - Math.pow(1 - p, 3);
    for (const [sel, [n, suf]] of Object.entries(stats)) $(sel).textContent = n === null ? "–" : Math.round(n * suave) + suf;
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}
const ioStats = new IntersectionObserver(([e]) => { if (e.isIntersecting) { ioStats.disconnect(); contar(); } }, { threshold: 0.4 });
ioStats.observe($(".stats"));

// Próximo partido + cuenta regresiva
const futuros = PARTIDOS.map((p) => ({ ...p, f: toDate(p.fecha) }))
  .filter((p) => p.f > new Date()).sort((a, b) => a.f - b.f);

const next = $("#next");
if (futuros.length) {
  const p = futuros[0];
  next.innerHTML = `
    <div>
      <p>${p.fechas ? p.fechas : p.torneo + " · " + p.f.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }) + " · " + hora(p.f)}</p>
      <h4>${p.rival ? "ESCÁNDALO vs " + p.rival : p.torneo}</h4>
      <p>${ico("pin")} ${p.lugar}</p>
    </div>
    <div class="count" id="count"></div>`;
  const tick = () => {
    let s = Math.max(0, Math.floor((p.f - new Date()) / 1000));
    const v = [["Días", Math.floor(s / 86400)], ["Hs", Math.floor(s / 3600) % 24], ["Min", Math.floor(s / 60) % 60], ["Seg", s % 60]];
    $("#count").innerHTML = v.map(([l, n]) => `<div><b>${String(n).padStart(2, "0")}</b><small>${l}</small></div>`).join("");
  };
  tick(); setInterval(tick, 1000);
} else {
  next.innerHTML = `<div><h4>Próximamente</h4><p>Todavía no hay partidos cargados.</p></div>`;
}

// Entrenamientos
$("#train").innerHTML = TEAM.entrenamientos.map((e) => `<div><b>${e.dia}</b> ${e.hora} hs · ${e.lugar}${e.mapa ? ` · <a href="${e.mapa}" target="_blank" rel="noopener">${ico("pin")} Ver ubicación</a>` : ""}</div>`).join("");

// Plantel
// Orden aleatorio en cada carga (Fisher-Yates), para que nadie quede siempre primero
const mezclados = [...JUGADORES];
for (let i = mezclados.length - 1; i > 0; i--) {
  const k = Math.floor(Math.random() * (i + 1));
  [mezclados[i], mezclados[k]] = [mezclados[k], mezclados[i]];
}
const slugJugador = (j) => j.foto.replace(/\.[a-z0-9]+$/i, "");
const SITIO = "https://escandaloultimate.com";
const urlCarta = (j) => `${SITIO}/jugador/${slugJugador(j)}`;
const textoCarta = (j) => `Conocé a ${j.apodo}${j.numero ? " (#" + j.numero + ")" : ""}, de Escándalo Ultimate`;
const linkWhatsApp = (j) => "https://wa.me/?text=" + encodeURIComponent(`${textoCarta(j)} 👉 ${urlCarta(j)}`);
$("#players").innerHTML = mezclados.map((j) => `
  <article class="pcard" tabindex="0" data-slug="${slugJugador(j)}" aria-label="${j.nombre}: tocá para dar vuelta la carta">
    <div class="pcard-in">
      <div class="cara frente">
        <img src="assets/jugadores/${j.foto}" alt="${j.nombre} (${j.apodo})" loading="lazy">
        <span class="pcard-giro" aria-hidden="true">↻</span>
      </div>
      <div class="cara dorso">
        <img class="dorso-logo" src="assets/logos/logo.webp" alt="">
        ${j.numero ? `<span class="dorso-num" aria-hidden="true">${j.numero}</span>` : ""}
        <span class="dorso-apodo">${j.apodo}</span>
        <b class="dorso-nombre">${j.nombre}</b>
        <ul class="dorso-datos">
          ${j.numero ? `<li><small>Camiseta</small><b>#${j.numero}</b></li>` : ""}
          ${j.nacionalidad ? `<li><small>Nacionalidad</small><b>${j.nacionalidad}</b></li>` : ""}
          ${j.dato ? `<li class="dorso-dato"><small>Dato</small><b>${j.dato}</b></li>` : ""}
        </ul>
        <div class="dorso-acciones">
          <button class="dorso-btn dorso-zoom" type="button" title="Ver carta completa" aria-label="Ver carta completa">${ico("ampliar")}</button>
          <a class="dorso-btn" href="assets/jugadores/compartir/${slugJugador(j)}.jpg" download="Escandalo-${j.apodo}.jpg" title="Descargar carta" aria-label="Descargar carta">${ico("descargar")}</a>
          <a class="dorso-btn dorso-wa" href="${linkWhatsApp(j)}" target="_blank" rel="noopener" title="Enviar por WhatsApp" aria-label="Enviar por WhatsApp">${ico("whatsapp")}</a>
          <button class="dorso-btn dorso-compartir" type="button" title="Compartir link de la carta">${ico("compartir")}<span>Compartir</span></button>
        </div>
      </div>
    </div>
  </article>`).join("");
// Adelanto de galería: 4 fotos
$("#teaser").innerHTML = GALERIA.filter((g) => g.tipo === "foto").slice(0, 4).map((g) =>
  `<a class="gitem" href="/galeria#primavera"><img src="assets/${g.src}" alt="Foto del equipo" loading="lazy"></a>`).join("");

// Cartas de jugadores: al tocarlas se dan vuelta; "Ver carta completa" la amplía
const lb = $("#lb");
$("#players").addEventListener("click", (e) => {
  const carta = e.target.closest(".pcard"); if (!carta) return;
  if (e.target.closest(".dorso-acciones a")) return;          // descargar: deja que el navegador baje la imagen
  if (e.target.closest(".dorso-compartir")) { compartirCarta(carta.dataset.slug); return; }
  if (e.target.closest(".dorso-zoom")) {
    lb.querySelector("img").src = carta.querySelector(".frente img").src; lb.classList.add("open");
    return;
  }
  carta.classList.toggle("girada");
});
$("#players").addEventListener("keydown", (e) => {
  const carta = e.target.closest(".pcard");
  if (carta && e.target === carta && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); carta.classList.toggle("girada"); }
});
lb.addEventListener("click", () => lb.classList.remove("open"));
document.addEventListener("keydown", (e) => e.key === "Escape" && lb.classList.remove("open"));

// Compartir el link de una carta (al abrirlo se ve la carta en grande): menú del celular o, si no hay, copiar
function aviso(texto) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = texto;
  t.classList.remove("ver"); void t.offsetWidth; t.classList.add("ver");
}
async function compartirCarta(slug) {
  const j = JUGADORES.find((x) => slugJugador(x) === slug); if (!j) return;
  const url = urlCarta(j);
  try {
    if (navigator.share) { await navigator.share({ title: textoCarta(j), text: textoCarta(j), url }); return; }
    await navigator.clipboard.writeText(url);
    aviso("Link de la carta copiado ✓");
  } catch (err) {
    if (err && err.name === "AbortError") return;      // el usuario cerró el menú de compartir
    try { await navigator.clipboard.writeText(url); aviso("Link de la carta copiado ✓"); } catch (e2) { aviso(url); }
  }
}

// Link directo a una carta (/#j-slug, desde /jugador/slug): la muestra en grande
const linkCarta = location.hash.match(/^#j-([\w-]+)$/);
if (linkCarta) {
  const carta = document.querySelector(`.pcard[data-slug="${linkCarta[1]}"]`);
  if (carta) {
    $("#plantel").scrollIntoView();
    lb.querySelector("img").src = carta.querySelector(".frente img").src;
    lb.classList.add("open");
  }
}

// Formulario → WhatsApp, con avisos propios en vez de los del navegador
const REGLAS = {
  nombre: (v) => v.length >= 2 || "Contanos cómo te llamás",
  contacto: (v) => !v ? "Dejanos un teléfono o mail para escribirte"
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^\+?[\d\s()-]{8,}$/.test(v) || "Ese no parece un teléfono ni un mail válido",
};
function validar(input) {
  const r = REGLAS[input.name](input.value.trim());
  const campo = input.closest(".campo");
  campo.classList.remove("mal"); void campo.offsetWidth;    // reinicia el temblor si vuelve a fallar
  campo.classList.toggle("mal", r !== true);
  input.setAttribute("aria-invalid", r !== true);
  campo.querySelector(".aviso").textContent = r === true ? "" : r;
  return r === true;
}
const inputs = [...$("#form").querySelectorAll(".campo input")];
inputs.forEach((i) => i.addEventListener("input", () => i.closest(".campo").classList.contains("mal") && validar(i)));
$("#form").addEventListener("submit", (e) => {
  e.preventDefault();
  const malos = inputs.filter((i) => !validar(i));
  if (malos.length) return malos[0].focus();
  const f = new FormData(e.target);
  const txt = `Hola Escándalo! Soy ${f.get("nombre")}. Contacto: ${f.get("contacto")}. Experiencia: ${f.get("exp")}. ${f.get("msg") || ""}`;
  window.open(`https://wa.me/${TEAM.whatsapp}?text=${encodeURIComponent(txt)}`, "_blank");
});

// Menú móvil, nav al scrollear, animaciones
const menu = $("#menu");
$("#burger").onclick = () => menu.classList.toggle("open");
menu.addEventListener("click", () => menu.classList.remove("open"));
addEventListener("scroll", () => $("#nav").classList.toggle("solid", scrollY > 40), { passive: true });

