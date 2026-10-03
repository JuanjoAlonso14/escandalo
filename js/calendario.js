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
function pintarMes() {
  const y = vista.getFullYear(), m = vista.getMonth();
  $("#mes-titulo").textContent = `${NOMBRES[m]} ${y}`;
  const primero = (new Date(y, m, 1).getDay() + 6) % 7;   // semana arranca el lunes
  const total = new Date(y, m + 1, 0).getDate();
  let html = ["L","M","M","J","V","S","D"].map((d) => `<div class="dow">${d}</div>`).join("") + '<div class="day empty"></div>'.repeat(primero);
  for (let d = 1; d <= total; d++) {
    const f = new Date(y, m, d), wd = f.getDay();
    const t = torneos.find((t) => f >= t.d && f <= t.h);
    const cls = ["day", t ? (pasado(t) ? "t-past" : "t-future") : "", DIAS_ENTRENO.includes(wd) ? "entreno" : "",
      f.toDateString() === hoy.toDateString() ? "today" : ""].join(" ");
    html += `<div class="${cls}"><span>${d}</span>${t && (+f === +t.d || d === 1 || wd === 1) ? `<small>${t.nombre.split(" · ")[0]}</small>` : ""}</div>`;
  }
  $("#month-grid").innerHTML = html;
}
$("#mes-prev").onclick = () => { vista.setMonth(vista.getMonth() - 1); pintarMes(); };
$("#mes-next").onclick = () => { vista.setMonth(vista.getMonth() + 1); pintarMes(); };
$("#mes-hoy").onclick = () => { vista = new Date(hoy.getFullYear(), hoy.getMonth(), 1); pintarMes(); };
pintarMes();
$("#fixture").innerHTML = torneos.map((t) =>
  `<div class="row ${pasado(t) ? "win" : ""}"><div class="date">${t.d.getDate()}<small>${MESES[t.d.getMonth()]}</small></div>
    <div class="info"><b>${t.nombre}</b><small>${rango(t)} · ${t.lugar}</small></div>
    <div class="score small">${pasado(t) ? (t.logro || "Jugado") : "Próximo"}</div></div>`).join("");

// Resultados
$("#results").innerHTML = RESULTADOS.map((r) => {
  const { d, m } = parts(toDate(r.fecha));
  const cls = esV(r) ? "win" : esD(r) ? "loss" : "";
  return `<div class="row ${cls}"><div class="date">${d}<small>${m}</small></div>
    <div class="info"><b>vs ${r.rival}</b><small>${r.torneo}</small></div>
    <div class="score">${r.resultado ? (esV(r) ? "Victoria" : "Derrota") : r.nuestros + " - " + r.suyos}</div></div>`;
}).join("");

