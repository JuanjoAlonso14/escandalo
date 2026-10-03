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
const stats = { "#st-jug": JUGADORES.length, "#st-gan": gan, "#st-par": RESULTADOS.length };
for (const [sel, n] of Object.entries(stats)) $(sel).textContent = n;
$("#st-pct").textContent = RESULTADOS.length ? Math.round((gan / RESULTADOS.length) * 100) + "%" : "–";

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
      <p>📍 ${p.lugar}</p>
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
$("#train").innerHTML = TEAM.entrenamientos.map((e) => `<div><b>${e.dia}</b> ${e.hora} hs · ${e.lugar}${e.mapa ? ` · <a href="${e.mapa}" target="_blank" rel="noopener">📍 Ver ubicación</a>` : ""}</div>`).join("");

// Plantel
$("#players").innerHTML = JUGADORES.map((j) => `
  <article class="pcard">
    <img src="assets/jugadores/${j.foto}" alt="${j.nombre} (${j.apodo})" loading="lazy">
  </article>`).join("");
// Adelanto de galería: 4 fotos
$("#teaser").innerHTML = GALERIA.filter((g) => g.tipo === "foto").slice(0, 4).map((g) =>
  `<a class="gitem" href="/galeria#primavera"><img src="assets/${g.src}" alt="Foto del equipo" loading="lazy"></a>`).join("");

// Zoom de tarjetas de jugadores
const lb = $("#lb");
$("#players").addEventListener("click", (e) => {
  const img = e.target.closest("img"); if (!img) return;
  lb.querySelector("img").src = img.src; lb.classList.add("open");
});
lb.addEventListener("click", () => lb.classList.remove("open"));
document.addEventListener("keydown", (e) => e.key === "Escape" && lb.classList.remove("open"));

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

