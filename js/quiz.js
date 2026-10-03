// Quiz de reglas: 10 preguntas al azar de verdadero o falso, basadas en el Reglamento WFDF 2025-2028.
// Para agregar preguntas: { n: nivel, t: "afirmación", v: true/false, r: "número de regla", e: "explicación corta" }
// n: nivel (1 fácil, 2 intermedio, 3 experto)
const PREGUNTAS = [
  { n: 1, t: "Cada equipo puede tener como máximo 7 jugadores en el campo durante un punto.", v: true, r: "5.1", e: "Máximo 7 y mínimo 5 jugadores por equipo en cada punto." },
  { n: 1, t: "Un partido lo gana el primer equipo que llega a 21 goles.", v: false, r: "4.2", e: "Gana el primer equipo que marca 15 goles." },
  { n: 1, t: "La media parte llega cuando un equipo marca por primera vez 8 goles.", v: true, r: "4.3", e: "El partido se divide en dos mitades y el corte es al llegar a 8." },
  { n: 1, t: "El lanzador puede correr con el disco si no tiene ningún defensor cerca.", v: false, r: "Introducción / 18.2", e: "El lanzador nunca puede correr con el disco: tiene que pivotar y pasarlo." },
  { n: 1, t: "Después de anotar un gol, el equipo que anotó es el que lanza el siguiente pull.", v: true, r: "4.5.3", e: "El equipo que anotó pasa a defensa y saca." },
  { n: 2, t: "Las líneas laterales y de fondo forman parte del campo de juego.", v: false, r: "2.3 / 11.1", e: "Las líneas perimetrales no son parte del campo: pisarlas es estar fuera." },
  { n: 2, t: "La línea de gol forma parte de la zona de gol.", v: false, r: "2.4", e: "La línea de gol es parte de la zona central, no de la zona de gol." },
  { n: 1, t: "El conteo va del 1 al 10 y entre cada número tiene que pasar al menos un segundo.", v: true, r: "9.1", e: "La marca dice “Contando” y cuenta del uno al diez, con al menos un segundo entre números." },
  { n: 2, t: "La marca solo puede contar si está a menos de 3 metros del pivote del lanzador.", v: true, r: "9.3.2", e: "Si se aleja más de 3 metros, el conteo se tiene que reiniciar." },
  { n: 2, t: "Si el lanzador no soltó el disco antes de que la marca empiece a decir “diez”, es pérdida de posesión.", v: true, r: "13.2.2", e: "Eso es un “stall-out” y el disco pasa al otro equipo." },
  { n: 2, t: "Si un atacante y un defensor atrapan el disco al mismo tiempo, la posesión es para la defensa.", v: false, r: "12.3", e: "Si lo atrapan simultáneamente, el ataque conserva la posesión." },
  { n: 1, t: "En Ultimate no hay árbitros: los propios jugadores cobran sus faltas.", v: true, r: "1.1", e: "Es un deporte autoarbitrado y sin contacto, basado en el Espíritu de Juego." },
  { n: 1, t: "Solo el jugador que recibió la falta puede cantarla.", v: true, r: "15.4", e: "La falta la pita únicamente quien la recibió, gritando “Falta”." },
  { n: 2, t: "Cualquier contacto menor entre jugadores que van al mismo punto siempre es falta.", v: false, r: "12.8", e: "El contacto menor al ir al mismo punto debe minimizarse, pero no es falta." },
  { n: 2, t: "Ir a buscar el disco (“hacer una jugada al disco”) justifica iniciar contacto con un rival.", v: false, r: "12.6.1", e: "Nunca hay justificación para iniciar contacto, ni siquiera por jugar el disco." },
  { n: 2, t: "Si después de discutir no hay acuerdo sobre una jugada, el disco vuelve al último lanzador no disputado.", v: true, r: "1.12", e: "Cuando no está claro qué pasó, se vuelve al último lanzador sin discusión." },
  { n: 2, t: "En el pull, un defensor puede tocar el disco antes de que lo toque un atacante o el suelo.", v: false, r: "7.7", e: "La defensa no puede tocar el pull hasta que lo toque un atacante o el suelo." },
  { n: 2, t: "Si un atacante toca el pull en el aire y no logra atraparlo, es pérdida de posesión.", v: true, r: "7.8", e: "Eso es un “pull caído” y la posesión pasa a la defensa." },
  { n: 2, t: "Antes del pull, los atacantes deben tener un pie sobre la línea de gol que defienden.", v: true, r: "7.3", e: "Y no pueden cambiar de lugar entre ellos hasta que se lance el pull." },
  { n: 3, t: "Si el pull cae directo fuera del campo, sin tocar el campo ni a un atacante, el ataque puede pedir “brick”.", v: true, r: "7.12", e: "Puede poner el disco en la marca de brick o donde salió del campo." },
  { n: 2, t: "El brick se pide extendiendo completamente un brazo por encima de la cabeza.", v: true, r: "7.12", e: "Hay que señalizarlo así antes de levantar el disco del suelo." },
  { n: 3, t: "Un defensor que pisa fuera de la línea lateral pasa a estar fuera de límites.", v: false, r: "11.2", e: "Los defensores siempre se consideran dentro de los límites." },
  { n: 3, t: "Un receptor que atrapa el disco con un pie apoyado sobre la línea lateral hace una recepción válida.", v: false, r: "11.1 / 11.4.1", e: "La línea es fuera de límites: si tocaba fuera al agarrar el disco, es turnover." },
  { n: 2, t: "El disco puede volar por fuera de la línea lateral, volver al campo y seguir en juego.", v: true, r: "11.7", e: "El disco solo sale cuando toca el área de fuera o a un atacante que está fuera." },
  { n: 1, t: "Es gol si el receptor atrapa el disco con todos sus apoyos dentro de la zona de gol que ataca.", v: true, r: "14.1", e: "Además tiene que establecer la posesión y mantener la captura." },
  { n: 2, t: "Para que una captura sea válida alcanza con tocar el disco con una mano mientras todavía gira.", v: false, r: "12.1", e: "Captura es tener un disco que no gira entre al menos dos partes del cuerpo." },
  { n: 1, t: "Está permitido entregarle el disco en la mano a un compañero sin que vuele.", v: false, r: "13.2.3", e: "Eso es una “entrega” (handover) y provoca pérdida de posesión." },
  { n: 2, t: "El lanzador puede tirar el disco al aire y atraparlo él mismo si nadie más lo tocó.", v: false, r: "13.2.5", e: "Eso es un “autopase” y provoca pérdida de posesión." },
  { n: 2, t: "Pasos (“travel”) es una infracción y no detiene el juego.", v: true, r: "15.2 / 18.2.5", e: "Se corrige el pivote y el juego sigue sin detenerse." },
  { n: 3, t: "Cualquier defensor puede cantar pasos (“travel”).", v: true, r: "15.5.1", e: "Los pasos los puede llamar cualquier defensor, no solo la marca." },
  { n: 3, t: "Hay doble marca si otro defensor, además de la marca, está a menos de 3 m del pivote sin marcar a otro atacante.", v: true, r: "18.1.1.5", e: "Solo cruzar esa zona no cuenta como doble marca." },
  { n: 3, t: "La doble marca solo la puede cantar el lanzador.", v: false, r: "15.5.1", e: "La doble marca la puede pitar cualquier atacante." },
  { n: 3, t: "Tras un turnover en la zona central, hay 10 segundos para poner el pivote desde que el disco se detiene.", v: true, r: "8.5.1.1", e: "En la zona de gol son 20 segundos." },
  { n: 1, t: "Un tiempo muerto dura 75 segundos.", v: true, r: "20.2 / 20.3", e: "Tanto antes del pull como durante el punto, el tiempo muerto es de 75 segundos." },
  { n: 3, t: "Durante el punto, cualquier jugador del equipo atacante puede pedir tiempo muerto.", v: false, r: "20.3", e: "Después del pull, solo el lanzador con el disco puede pedirlo." },
  { n: 1, t: "Para pedir tiempo muerto hay que formar una “T” con las manos (o con una mano y el disco).", v: true, r: "20.1", e: "Y llamar “tiempo muerto” al equipo contrario." },
  { n: 2, t: "Los jugadores en la banda, salvo los capitanes, no deberían meterse en las discusiones.", v: true, r: "1.10.2", e: "Deciden los jugadores involucrados y los que mejor vieron la jugada." },
  { n: 1, t: "Felicitar a un rival por una buena jugada es un ejemplo de buen Espíritu de Juego.", v: true, r: "1.5.3", e: "Igual que presentarse al rival o retractarse de una llamada equivocada." },
  { n: 1, t: "Pedirle un pase a un jugador del equipo contrario es una táctica válida.", v: false, r: "1.6.6", e: "Es una violación clara del Espíritu de Juego." },
  { n: 1, t: "En los partidos mixtos se usa una proporción de género alternada de 4:3.", v: true, r: "5.4", e: "La proporción se va alternando entre puntos." },
  { n: 1, t: "Después de cada gol se pueden hacer cambios ilimitados de jugadores.", v: true, r: "5.3", e: "Siempre antes de que el equipo indique que está listo para el pull." },
  { n: 3, t: "Si en la misma jugada hay faltas aceptadas de los dos equipos, el disco vuelve al último lanzador no disputado.", v: true, r: "17.9.1", e: "Son faltas compensatorias." },
  { n: 2, t: "Si un jugador tiene una herida que sangra, hay que pedir una parada técnica.", v: true, r: "19.2.1", e: "Tiene 70 segundos para solucionarlo." },
  { n: 3, t: "Si se acepta una falta por strip en una recepción que hubiera sido gol, se concede el gol.", v: true, r: "17.3.2", e: "El strip es una falta que hace soltar un disco ya atrapado." },
  { n: 3, t: "El juego peligroso solo se considera falta si llega a haber contacto.", v: false, r: "17.1.1", e: "Es falta aunque no haya contacto." },
  { n: 3, t: "El lanzador puede pivotar en cualquier dirección mientras mantenga su punto de pivote.", v: true, r: "18.2.2", e: "Si levanta o mueve el pie de pivote antes de soltar el pase, son pasos." },
  { n: 3, t: "Si atrapás corriendo, podés pasarla sin frenar si no cambiás de dirección y das como mucho dos apoyos más.", v: true, r: "18.2.1.1", e: "Tampoco podés acelerar antes de soltar el pase." },
  { n: 3, t: "Después de un stall-out contestado, el conteo se reanuda en 8.", v: true, r: "9.5.3", e: "Se retoma con “Contando ocho”." },
  { n: 3, t: "Después de un incumplimiento de la defensa aceptado, el conteo vuelve a empezar desde 1.", v: true, r: "9.5.1", e: "Si el error lo aceptó la defensa, se reinicia en “Contando uno”." },
  { n: 3, t: "Después de una llamada de obstrucción (“pick”), el conteo se retoma como máximo en 6.", v: true, r: "9.5.5", e: "Para la mayoría de las demás llamadas, el conteo vuelve como máximo a seis." },
  { n: 3, t: "Un jugador en el aire conserva su estado dentro/fuera de límites hasta que vuelve a tocar el suelo.", v: true, r: "11.3.1", e: "Su estado se define recién al hacer contacto con el campo o con el área de fuera." },
  { n: 3, t: "Antes de cantar “pick”, el defensor puede esperar hasta 2 segundos para ver si la obstrucción afecta la jugada.", v: true, r: "18.3.1.1", e: "Lo mismo vale para las faltas indirectas (17.8.1.1)." },
  { n: 3, t: "Si la defensa se adelanta en el pull (offside) y el ataque lo cobra, debe dejar caer el disco y se juega como brick.", v: true, r: "7.5.2", e: "El ataque deja que el disco toque el suelo y reanuda como si hubiera pedido brick." },
  { n: 3, t: "Si el lanzador pide tiempo muerto cuando a su equipo no le quedan, se suman 2 segundos al conteo.", v: true, r: "20.4", e: "Si con eso el conteo llega a 10 o más, es stall-out." },
  { n: 3, t: "Si cualquier parte del cuerpo del defensor está por encima del punto de pivote del lanzador, es “wrapping”.", v: true, r: "18.1.1.4", e: "Salvo que la situación la cause solo el movimiento del lanzador." },
  { n: 3, t: "Si el lanzador se acerca al defensor y por eso queda a menos de un disco de distancia, es infracción de “espacio de disco” del defensor.", v: false, r: "18.1.1.3", e: "Si la cercanía la causa solo el movimiento del lanzador, no es infracción." },
  { n: 3, t: "Después de un turnover en una zona de gol, el pivote debe establecerse dentro de los 10 segundos.", v: false, r: "8.5.1.2", e: "En la zona de gol el plazo es de 20 segundos; en la zona central, 10." },
  { n: 1, t: "En Ultimate cada equipo juega con 11 jugadores en el campo.", v: false, r: "5.1", e: "Son 7 por equipo (como mínimo 5). En playa se juega 5 contra 5." },
  { n: 1, t: "En Ultimate está permitido empujar o bloquear al rival con el cuerpo.", v: false, r: "1.1 / 12.6", e: "Es un deporte sin contacto: nadie puede iniciar contacto con un rival." },
  { n: 1, t: "Para anotar alcanza con que el disco entre volando en la zona de gol, aunque nadie lo atrape.", v: false, r: "14.1", e: "El gol se marca cuando un compañero atrapa un pase dentro de la zona de gol que ataca." },
  { n: 1, t: "Si un pase cae al suelo, el equipo que lo lanzó conserva el disco.", v: false, r: "13.1.1", e: "Si el disco toca el suelo sin que lo tenga el ataque, la posesión pasa al otro equipo." },
  { n: 1, t: "Burlarse del rival después de anotar un gol es parte del juego.", v: false, r: "1.6.4", e: "Las celebraciones irrespetuosas son una violación del Espíritu de Juego." },
  { n: 1, t: "El lanzador solo puede pasar el disco hacia adelante.", v: false, r: "Introducción", e: "Se puede pasar en cualquier dirección a cualquier compañero." },
  { n: 3, t: "Después de un tiempo muerto pedido durante el punto, se pueden hacer cambios de jugadores libremente.", v: false, r: "20.3.1", e: "No se permiten cambios, salvo por lesión." },
  { n: 3, t: "Después de una infracción de pasos aceptada, el juego se detiene.", v: false, r: "18.2.5", e: "El juego no se detiene: se corrige el pivote y se sigue." },
  { n: 3, t: "Una falta indirecta hay que cantarla en el instante del contacto, sin poder esperar.", v: false, r: "17.8.1.1", e: "Se puede demorar hasta 2 segundos para ver si afecta la jugada." },
  { n: 3, t: "Después de un incumplimiento del ataque aceptado, el conteo se reinicia en 1.", v: false, r: "9.5.2", e: "Se retoma como máximo en 9, no desde 1." },
  { n: 3, t: "Un jugador con una herida que sangra tiene 3 minutos para solucionarlo.", v: false, r: "19.2.1.2", e: "Tiene 70 segundos; si necesita más, debe ser sustituido o su equipo usa un tiempo muerto." },
  { n: 3, t: "Después de un tiempo muerto, el disco lo puede retomar otro compañero como lanzador.", v: false, r: "20.3.3", e: "El lanzador tiene que seguir siendo el mismo." },
  { n: 3, t: "Al reanudar tras un tiempo muerto, los defensores eligen su posición antes que los atacantes.", v: false, r: "20.3.4 / 20.3.5", e: "Primero se ubican los atacantes y después los defensores." },
];

const APROBADO = 7;  // respuestas correctas necesarias de 10
const modal = document.querySelector("#quiz");
const caja = modal.querySelector(".quiz-caja");
const NIVELES = {
  1: { nombre: "Fácil", desc: "Lo básico para arrancar: cómo se juega, cómo se gana y el Espíritu de Juego." },
  2: { nombre: "Intermedio", desc: "El pull, las líneas, las capturas, el conteo y las pérdidas de posesión." },
  3: { nombre: "Experto", desc: "Reinicios del conteo, marcaje, pivote, faltas especiales y casos finos." },
};
let ronda = [], respuestas = [], actual = 0, nivel = 1;

function mezclar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [a[i], a[k]] = [a[k], a[i]]; }
  return a;
}
function abrirQuiz() {
  modal.classList.add("open");
  caja.innerHTML = `
    <div class="quiz-top"><span>Quiz de reglas</span><button class="quiz-x" aria-label="Cerrar">✕</button></div>
    <h3 class="quiz-titulo">Elegí tu nivel</h3>
    <p class="quiz-sub">10 preguntas de verdadero o falso. Aprobás con ${APROBADO} correctas.</p>
    <div class="quiz-niveles">${Object.entries(NIVELES).map(([n, x]) => `
      <button class="quiz-nivel n${n}" data-nivel="${n}">
        <span class="quiz-dots">${"●".repeat(n)}${"○".repeat(3 - n)}</span>
        <b>${x.nombre}</b><small>${x.desc}</small>
      </button>`).join("")}
    </div>`;
  caja.classList.remove("entra"); void caja.offsetWidth; caja.classList.add("entra");
}
function empezar(n) {
  nivel = n;
  ronda = mezclar(PREGUNTAS.filter((p) => p.n === n)).slice(0, 10);
  respuestas = []; actual = 0;
  mostrarPregunta();
}
function cerrarQuiz() { modal.classList.remove("open"); }

function mostrarPregunta() {
  const p = ronda[actual];
  caja.innerHTML = `
    <div class="quiz-top"><span>Nivel ${NIVELES[nivel].nombre} · Pregunta ${actual + 1} de ${ronda.length}</span><button class="quiz-x" aria-label="Cerrar">✕</button></div>
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
  const ok = ronda.length - fallos.length, aprobado = ok >= APROBADO;
  const vf = (b) => (b ? "Verdadero" : "Falso");
  caja.innerHTML = `
    <div class="quiz-top"><span>Resultado · Nivel ${NIVELES[nivel].nombre}</span><button class="quiz-x" aria-label="Cerrar">✕</button></div>
    <div class="quiz-res ${aprobado ? "aprobado" : "desaprobado"}">
      <div class="quiz-nota"><b>${ok}</b><small>de ${ronda.length}</small></div>
      <h3>${aprobado ? "¡Aprobado!" : "No aprobado"}</h3>
      <p>${aprobado ? (fallos.length ? "Muy bien. Repasá las que fallaste:" : "¡Perfecto! No fallaste ninguna.") : `Necesitás ${APROBADO} de ${ronda.length} para aprobar. Repasá estas reglas y volvé a intentar:`}</p>
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
