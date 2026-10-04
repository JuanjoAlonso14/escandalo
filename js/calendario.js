const $ = (s) => document.querySelector(s);
const MESES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
const toDate = (s) => new Date(s.includes(" ") ? s.replace(" ", "T") : s + "T00:00");
const parts = (d) => ({ d: d.getDate(), m: MESES[d.getMonth()] });
const esV = (r) => r.resultado ? r.resultado === "V" : r.nuestros > r.suyos;
const esD = (r) => r.resultado ? r.resultado === "D" : r.nuestros < r.suyos;
$("#year").textContent = new Date().getFullYear();
$("#ig").href = TEAM.instagram;
$("#mail").href = "mailto:" + TEAM.email;
$("#wa").href = "https://wa.me/" + TEAM.whatsapp;
$("#burger").onclick = () => $("#menu").classList.toggle("open");
$("#menu").addEventListener("click", () => $("#menu").classList.remove("open"));

// Calendario del año
const hoy = new Date();
const anio = hoy.getFullYear();
const torneos = TORNEOS.map((t) => ({ ...t, d: toDate(t.desde), h: toDate(t.hasta) })).sort((a, b) => a.d - b.d);
const rango = (t) => t.d.getDate() === t.h.getDate() && t.d.getMonth() === t.h.getMonth()
  ? `${t.d.getDate()} ${MESES[t.d.getMonth()]}` : `${t.d.getDate()} ${MESES[t.d.getMonth()]} – ${t.h.getDate()} ${MESES[t.h.getMonth()]}`;
const pasado = (t) => new Date(t.h.getTime() + 864e5) < hoy;
// Calendario mensual
const NOMBRES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_ENTRENO = TEAM.entrenamientos.map((e) => ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"].indexOf(e.dia));
let vista = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
let elegido = null;   // día abierto en el panel de detalle (AAAA-MM-DD)
function pintarMes() {
  const y = vista.getFullYear(), m = vista.getMonth();
  $("#mes-titulo").textContent = `${NOMBRES[m]} ${y}`;
  const primero = (new Date(y, m, 1).getDay() + 6) % 7;   // semana arranca el lunes
  const total = new Date(y, m + 1, 0).getDate();
  let html = ["L","M","M","J","V","S","D"].map((d) => `<div class="dow">${d}</div>`).join("") + '<div class="day empty"></div>'.repeat(primero);
  for (let d = 1; d <= total; d++) {
    const f = new Date(y, m, d), wd = f.getDay();
    const t = torneos.find((t) => f >= t.d && f <= t.h);
    const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const entrena = !t && DIAS_ENTRENO.includes(wd);   // los días de torneo no hay práctica
    const algo = t || entrena || RESULTADOS.some((r) => r.fecha === iso);
    const cls = ["day", t ? (pasado(t) ? "t-past" : "t-future") : "", entrena ? "entreno" : "",
      f.toDateString() === hoy.toDateString() ? "today" : "", algo ? "tiene" : "", iso === elegido ? "elegido" : ""].join(" ");
    html += `<div class="${cls}" data-fecha="${iso}"${algo ? ' role="button" tabindex="0"' : ""}><span>${d}</span>${t && (+f === +t.d || d === 1 || wd === 1) ? `<small>${t.nombre.split(" · ")[0]}</small>` : ""}</div>`;
  }
  $("#month-grid").innerHTML = html;
}
$("#mes-prev").onclick = () => { vista.setMonth(vista.getMonth() - 1); cerrarDia(); };
$("#mes-next").onclick = () => { vista.setMonth(vista.getMonth() + 1); cerrarDia(); };
$("#mes-hoy").onclick = () => { vista = new Date(hoy.getFullYear(), hoy.getMonth(), 1); cerrarDia(); };

// Detalle del día: al tocar un día con torneo, partidos o entrenamiento
const DIAS_LARGOS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
function abrirDia(iso) {
  const f = toDate(iso);
  const t = torneos.find((x) => f >= x.d && f <= x.h);
  const partidos = RESULTADOS.filter((r) => r.fecha === iso);
  const entrenos = t ? [] : TEAM.entrenamientos.filter((e) => e.dia === DIAS_LARGOS[f.getDay()]);
  let html = `<div class="dia-cab"><h4>${DIAS_LARGOS[f.getDay()]} ${f.getDate()} de ${NOMBRES[f.getMonth()].toLowerCase()}</h4>
    <button class="dia-x" aria-label="Cerrar">${ico("cerrar")}</button></div>`;
  if (t) html += `<div class="dia-bloque ${pasado(t) ? "jugado" : "proximo"}">
      <span class="dia-tag">${pasado(t) ? "Torneo jugado" : "Torneo próximo"}</span>
      <b>${t.nombre}</b>
      <p>${ico("calendario")} ${rango(t)} &nbsp;·&nbsp; ${ico("pin")} ${t.lugar}</p>
      ${t.logro && pasado(t) ? `<p class="dia-logro">${conIconos(t.logro)}</p>` : ""}
      ${!pasado(t) && f >= hoy ? `<p>Faltan ${Math.ceil((t.d - hoy) / 864e5)} días para que empiece.</p>` : ""}
      <a class="btn ghost dia-mapa" href="/torneo#${t.id}">Ver torneo →</a>
    </div>`;
  if (partidos.length) html += `<div class="dia-bloque">
      <span class="dia-tag">Partidos de este día</span>
      ${partidos.map((r) => `<div class="dia-partido ${esV(r) ? "win" : esD(r) ? "loss" : ""}">
        <span>vs <b>${r.rival}</b><small>${r.torneo.split(" · ").slice(1).join(" · ") || r.torneo}</small></span>
        <strong>${r.resultado ? (esV(r) ? "Victoria" : "Derrota") : r.nuestros + " - " + r.suyos}</strong></div>`).join("")}
    </div>`;
  if (entrenos.length) html += entrenos.map((e) => `<div class="dia-bloque entreno">
      <span class="dia-tag">Entrenamiento</span>
      <b>${e.hora} hs · ${e.lugar}</b>
      ${e.mapa ? `<a class="btn ghost dia-mapa" href="${e.mapa}" target="_blank" rel="noopener">${ico("pin")} Cómo llegar</a>` : ""}
    </div>`).join("");
  elegido = iso;
  pintarMes();
  const panel = $("#dia-info");
  panel.innerHTML = html;
  $("#dia-modal").classList.add("open");
  panel.classList.remove("abre"); void panel.offsetWidth; panel.classList.add("abre");
  panel.querySelector(".dia-x").focus({ preventScroll: true });
}
function cerrarDia() { elegido = null; $("#dia-modal").classList.remove("open"); pintarMes(); }
$("#month-grid").addEventListener("click", (e) => {
  const c = e.target.closest(".day.tiene"); if (!c) return;
  c.dataset.fecha === elegido ? cerrarDia() : abrirDia(c.dataset.fecha);
});
$("#month-grid").addEventListener("keydown", (e) => {
  const c = e.target.closest(".day.tiene");
  if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); abrirDia(c.dataset.fecha); }
});
$("#dia-modal").addEventListener("click", (e) => { if (e.target.closest(".dia-x") || e.target.id === "dia-modal") cerrarDia(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#dia-modal").classList.contains("open")) cerrarDia(); });
pintarMes();
$("#fixture").innerHTML = torneos.map((t) =>
  `<a class="row ${pasado(t) ? "win" : ""}" href="/torneo#${t.id}"><div class="date">${t.d.getDate()}<small>${MESES[t.d.getMonth()]}</small></div>
    <div class="info"><b>${t.nombre}</b><small>${rango(t)} · ${t.lugar}</small></div>
    <div class="score small">${pasado(t) ? (t.logro ? conIconos(t.logro) : "Jugado") : "Próximo"}</div></a>`).join("");

// Resultados
$("#results").innerHTML = RESULTADOS.map((r) => {
  const { d, m } = parts(toDate(r.fecha));
  const cls = esV(r) ? "win" : esD(r) ? "loss" : "";
  return `<div class="row ${cls}"><div class="date">${d}<small>${m}</small></div>
    <div class="info"><b>vs ${r.rival}</b><small>${r.torneo}</small></div>
    <div class="score">${r.resultado ? (esV(r) ? "Victoria" : "Derrota") : r.nuestros + " - " + r.suyos}</div></div>`;
}).join("");

// Datos estructurados: cada torneo como evento deportivo
(() => {
  const s = document.createElement("script");
  s.type = "application/ld+json";
  s.textContent = JSON.stringify(torneos.map((t) => ({
    "@context": "https://schema.org", "@type": "SportsEvent",
    name: t.nombre, startDate: t.desde, endDate: t.hasta,
    eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: t.lugar, address: t.lugar },
    url: `https://escandaloultimate.com/torneo#${t.id}`,
    organizer: { "@type": "Organization", name: "Escándalo Ultimate" },
  })));
  document.head.appendChild(s);
})();
