// Quiz de reglas WFDF: lógica del modal. Banco: js/preguntas.js (100 por nivel, se eligen al azar).
const APROBADO = 7;  // respuestas correctas necesarias de 10 (niveles públicos)
const modal = document.querySelector("#quiz");
const caja = modal.querySelector(".quiz-caja");
const NIVELES = {
  1: { nombre: "Fácil", desc: "Lo básico para arrancar: cómo se juega, cómo se gana y el Espíritu de Juego." },
  2: { nombre: "Intermedio", desc: "El pull, las líneas, las capturas, el conteo y las pérdidas de posesión." },
  3: { nombre: "Experto", desc: "Reinicios del conteo, marcaje, pivote, faltas especiales y casos finos." },
  4: { nombre: "Maestro", desc: "Casos límite: brick, strip, pick, pivote y reanudaciones.", cuenta: true, meta: 8, cuantas: 10 },
  5: { nombre: "Leyenda", desc: "Reglamento fino a muerte: 12 preguntas y aprobás con 10.", cuenta: true, meta: 10, cuantas: 12 },
};
let ronda = [], respuestas = [], actual = 0, nivel = 1, metaAprobado = APROBADO;

function logueado() {
  return !!document.documentElement.dataset.cuenta || !!(typeof Sesion !== "undefined" && Sesion.actual && Sesion.actual());
}
function mezclar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; }
  return a;
}
function nivelesVisibles() {
  const hay = logueado();
  return Object.entries(NIVELES).filter(([, x]) => !x.cuenta || hay);
}
function abrirQuiz() {
  modal.classList.add("open");
  const visibles = nivelesVisibles();
  const maxN = Math.max(...visibles.map(([n]) => +n));
  const extra = logueado() ? " Con tu cuenta también desbloqueás Maestro y Leyenda." : "";
  caja.innerHTML = `
    <div class="quiz-top"><span>Quiz de reglas</span><button class="quiz-x" aria-label="Cerrar">${ico("cerrar")}</button></div>
    <h3 class="quiz-titulo">Elegí tu nivel</h3>
    <p class="quiz-sub">Verdadero o falso según el reglamento WFDF. Aprobás con ${APROBADO} de 10 en los niveles básicos.${extra}</p>
    <div class="quiz-niveles">${visibles.map(([n, x]) => `
      <button class="quiz-nivel n${n}" data-nivel="${n}">
        <span class="quiz-dots">${"●".repeat(+n)}${"○".repeat(maxN - n)}</span>
        <b>${x.nombre}</b><small>${x.desc}</small>
      </button>`).join("")}
    </div>`;
  caja.classList.remove("entra"); void caja.offsetWidth; caja.classList.add("entra");
}
function empezar(n) {
  const info = NIVELES[n];
  if (!info || (info.cuenta && !logueado())) { abrirQuiz(); return; }
  nivel = n;
  metaAprobado = info.meta || APROBADO;
  const cuantas = info.cuantas || 10;
  ronda = mezclar(PREGUNTAS.filter((p) => p.n === n)).slice(0, cuantas);
  respuestas = []; actual = 0;
  mostrarPregunta();
}
function cerrarQuiz() { modal.classList.remove("open"); }

function mostrarPregunta() {
  const p = ronda[actual];
  caja.innerHTML = `
    <div class="quiz-top"><span>Nivel ${NIVELES[nivel].nombre} · Pregunta ${actual + 1} de ${ronda.length}</span><button class="quiz-x" aria-label="Cerrar">${ico("cerrar")}</button></div>
    <div class="quiz-barra"><i style="width:${(actual / ronda.length) * 100}%"></i></div>
    <p class="quiz-preg">${p.t}</p>
    <div class="quiz-opc">
      <button class="quiz-btn si" data-v="1">Verdadero</button>
      <button class="quiz-btn no" data-v="0">Falso</button>
    </div>`;
  caja.classList.remove("entra"); void caja.offsetWidth; caja.classList.add("entra");
}

function responder(valor) {
  const p = ronda[actual];
  respuestas.push(valor);
  const bien = valor === p.v;
  caja.querySelectorAll(".quiz-btn").forEach((b) => {
    b.disabled = true;
    if ((b.dataset.v === "1") === valor) b.classList.add(bien ? "bien" : "mal");
  });
  setTimeout(() => { actual++; actual < ronda.length ? mostrarPregunta() : mostrarResultado(); }, 550);
}

function mostrarResultado() {
  const fallos = ronda.map((p, i) => ({ p, dada: respuestas[i] })).filter((x) => x.dada !== x.p.v);
  const ok = ronda.length - fallos.length, aprobado = ok >= metaAprobado;
  const vf = (b) => (b ? "Verdadero" : "Falso");
  caja.innerHTML = `
    <div class="quiz-top"><span>Resultado · Nivel ${NIVELES[nivel].nombre}</span><button class="quiz-x" aria-label="Cerrar">${ico("cerrar")}</button></div>
    <div class="quiz-res ${aprobado ? "aprobado" : "desaprobado"}">
      <div class="quiz-nota"><b>${ok}</b><small>de ${ronda.length}</small></div>
      <h3>${aprobado ? "¡Aprobado!" : "No aprobado"}</h3>
      <p>${aprobado ? (fallos.length ? "Muy bien. Repasá las que fallaste:" : "¡Perfecto! No fallaste ninguna.") : `Necesitás ${metaAprobado} de ${ronda.length} para aprobar. Repasá estas reglas y volvé a intentar:`}</p>
    </div>
    ${fallos.length ? `<ol class="quiz-fallos">${fallos.map(({ p, dada }) => `
      <li>
        <p class="quiz-f-preg">${p.t}</p>
        <p class="quiz-f-resp">Respondiste <s>${vf(dada)}</s> · Correcto: <b>${vf(p.v)}</b></p>
        <p class="quiz-f-exp">${p.e} <span>Regla ${p.r}</span></p>
      </li>`).join("")}</ol>` : ""}
    <div class="quiz-fin">
      <button class="btn" id="quiz-otra">Hacer otro quiz</button>
      <button class="btn ghost" id="quiz-nivel">Cambiar nivel</button>
      <a class="btn ghost" href="assets/recursos/reglas-ultimate-2025-2028.pdf" target="_blank" rel="noopener">Leer el reglamento</a>
    </div>`;
  caja.classList.remove("entra"); void caja.offsetWidth; caja.classList.add("entra");
  caja.scrollTop = 0;
}

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-quiz]")) abrirQuiz();
  else if (e.target.closest(".quiz-x") || e.target === modal) cerrarQuiz();
  else if (e.target.closest("#quiz-otra")) empezar(nivel);
  else if (e.target.closest("#quiz-nivel")) abrirQuiz();
  else if (e.target.closest("[data-nivel]")) empezar(+e.target.closest("[data-nivel]").dataset.nivel);
  else { const b = e.target.closest(".quiz-btn"); if (b && !b.disabled) responder(b.dataset.v === "1"); }
});
document.addEventListener("keydown", (e) => {
  if (!modal.classList.contains("open")) return;
  if (e.key === "Escape") cerrarQuiz();
  const libre = caja.querySelector(".quiz-btn:not(:disabled)");
  if (libre && (e.key === "v" || e.key === "V")) responder(true);
  if (libre && (e.key === "f" || e.key === "F")) responder(false);
});
