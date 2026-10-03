// Página de un torneo: /torneo#id (el id está en TORNEOS, en js/data.js)
const MES_LARGO = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const aFecha = (s) => new Date(s + "T00:00");
const gano = (r) => r.resultado ? r.resultado === "V" : r.nuestros > r.suyos;
const tid = decodeURIComponent(location.hash.slice(1));
const torneo = TORNEOS.find((x) => x.id === tid) || TORNEOS[0];
const desde = aFecha(torneo.desde), hasta = aFecha(torneo.hasta);
const jugado = hasta.getTime() + 864e5 < Date.now();
const [base, ...resto] = torneo.nombre.split(" · ");
const partidos = RESULTADOS.filter((r) => r.torneo.split(" · ")[0] === base);
const media = GALERIA.filter((g) => (g.torneo || "primavera") === torneo.id);
const fotos = media.filter((g) => g.tipo === "foto"), videos = media.filter((g) => g.tipo === "video");
const portada = (GALERIA_TORNEOS.find((g) => g.id === torneo.id) || {}).portada;

function textoFechas() {
  const dias = [];
  for (let d = new Date(desde); d <= hasta; d.setDate(d.getDate() + 1)) dias.push(d.getDate());
  const lista = dias.length > 1 ? dias.slice(0, -1).join(", ") + " y " + dias[dias.length - 1] : dias[0];
  return desde.getMonth() === hasta.getMonth()
    ? `${lista} de ${MES_LARGO[desde.getMonth()]} de ${desde.getFullYear()}`
    : `${desde.getDate()} de ${MES_LARGO[desde.getMonth()]} al ${hasta.getDate()} de ${MES_LARGO[hasta.getMonth()]} de ${hasta.getFullYear()}`;
}

document.title = `${base} — Escándalo Ultimate`;
let html = `
  <a class="volver" href="/calendario">‹ Calendario</a>
  <header class="t-hero${portada ? "" : " sin-foto"}"${portada ? ` style="--img:url('/assets/${portada}')"` : ""}>
    <span class="t-estado ${jugado ? "jugado" : "proximo"}">${jugado ? "Torneo jugado" : "Próximo torneo"}</span>
    <h1 class="title">${base}${resto.length ? ` <span>${resto.join(" · ")}</span>` : ""}</h1>
    <p>${ico("calendario")} ${textoFechas()} &nbsp;·&nbsp; ${ico("pin")} ${torneo.lugar}</p>
    ${jugado && torneo.logro ? `<div class="t-logro">${conIconos(torneo.logro)}</div>` : ""}
  </header>`;

if (partidos.length) {
  const v = partidos.filter(gano).length, af = partidos.reduce((s, r) => s + (r.nuestros || 0), 0), ec = partidos.reduce((s, r) => s + (r.suyos || 0), 0);
  html += `<div class="t-stats">
    <div class="t-stat"><b>${partidos.length}</b><span>Partidos</span></div>
    <div class="t-stat"><b>${v}-${partidos.length - v}</b><span>Ganados-perdidos</span></div>
    <div class="t-stat"><b>${af}</b><span>Goles a favor</span></div>
    <div class="t-stat"><b>${ec}</b><span>Goles en contra</span></div>
    <div class="t-stat"><b>${af - ec > 0 ? "+" : ""}${af - ec}</b><span>Diferencia</span></div>
  </div>`;
  const fases = [];
  for (const r of partidos) {
    const f = r.torneo.split(" · ")[1] || "Partidos";
    let g = fases.find((x) => x.nombre === f);
    if (!g) fases.push((g = { nombre: f, partidos: [] }));
    g.partidos.push(r);
  }
  html += `<h2 class="grupo-ult">${jugado && torneo.logro ? "El camino al título" : "Partidos"}</h2>
  <div class="t-fases">${fases.map((f, i) => `
    <div class="t-fase${i === fases.length - 1 && torneo.logro ? " final" : ""}">
      <h3>${f.nombre}</h3>
      ${f.partidos.map((r) => `
      <div class="t-partido ${gano(r) ? "win" : "loss"}">
        <div class="${gano(r) ? "gana" : ""}"><span>Escándalo</span><b>${r.nuestros ?? (gano(r) ? "V" : "")}</b></div>
        <div class="${gano(r) ? "" : "gana"}"><span>${r.rival}</span><b>${r.suyos ?? (gano(r) ? "" : "V")}</b></div>
      </div>`).join("")}
    </div>`).join("")}
  </div>`;
} else if (!jugado) {
  const faltan = Math.ceil((desde - Date.now()) / 864e5);
  html += `<div class="t-espera">
    <b>${faltan > 0 ? faltan : 0}</b><span>${faltan === 1 ? "día" : "días"} para que empiece</span>
    <p>Todavía no se jugó. Cuando termine, acá vas a ver los resultados, las fotos y los videos.</p>
  </div>`;
}

if (media.length) {
  html += `<h2 class="grupo-ult">Fotos destacadas</h2>
  <div class="grid gallery t-fotos">${fotos.slice(0, 8).map((g) =>
    `<a class="gitem" href="/galeria#${torneo.id}"><img src="assets/${g.src}" alt="Foto del torneo" loading="lazy"></a>`).join("")}</div>
  <p class="center"><a class="btn" href="/galeria#${torneo.id}">Ver galería completa · ${fotos.length} fotos · ${videos.length} videos</a></p>`;
}

const otros = TORNEOS.filter((x) => x.id !== torneo.id);
if (otros.length) html += `<div class="t-otros"><span>Otros torneos:</span>${otros.map((x) =>
  `<a class="chip" href="/torneo#${x.id}">${x.nombre.split(" · ")[0]}</a>`).join("")}</div>`;

document.querySelector("#torneo").innerHTML = html;
addEventListener("hashchange", () => location.reload());
