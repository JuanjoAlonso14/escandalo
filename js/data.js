// =====================================================
//  DATOS DEL EQUIPO — editá solo este archivo
//  Las fotos van en las carpetas de /assets (ver LEEME.txt)
// =====================================================
const TEAM = {
  nombre: "Escándalo",
  whatsapp: "59898489298",          // 098 489 298 en formato internacional de Uruguay (+598), sin + ni espacios
  email: "escandaloultimate@gmail.com",
  instagram: "https://www.instagram.com/escandaloultimate/",
  entrenamientos: [
    { dia: "Martes",  hora: "19:00", lugar: "Brigada de Comunicaciones 1", mapa: "https://maps.app.goo.gl/7HYpu15j2bMttqfC8" },
    { dia: "Viernes", hora: "18:30", lugar: "Centro Juvenil Salesiano", mapa: "https://maps.app.goo.gl/UxxXn9xZ1p1vaQXS6" },
    { dia: "Domingo", hora: "16:00", lugar: "Facultad de Agronomía", mapa: "https://maps.app.goo.gl/iQH2DWrSgPoB1N3J8" },
  ],
};

// Fecha en formato AÑO-MES-DIA HORA:MIN. La cuenta regresiva usa el primer partido futuro.
// Para un torneo sin rival/horario definido usá "fechas" (texto libre) en vez de rival.
const PARTIDOS = [
  { fecha: "2026-12-04 00:00", torneo: "Copa Oriental 2026", lugar: "Punta del Este, Maldonado", fechas: "4, 5 y 6 de diciembre" },
];

// Texto de la página Historia (historia.html). Cada elemento es un párrafo.
// Está escrito con lo que se sabe del equipo: completalo con la fecha de fundación, quiénes lo armaron, etc.
const HISTORIA = [
  "Escándalo nació de las ganas de tener un grupo de amigos que la pase bien jugando al ultimate frisbee.",
  "Nuestro nombre y nuestra bomba lo dicen todo: jugamos con intensidad, con energía y con ganas de hacer ruido en cada punto, pero siempre desde el respeto. En el Ultimate no hay árbitros; nos regimos por el espiritu de juego, y eso es lo que queremos que nos represente adentro y afuera de la cancha.",
  "En septiembre de 2026 jugamos nuestro primer torneo oficial, la Copa Primavera en Florida. Ganamos los cinco partidos y nos quedamos con el campeonato 🏆. Fue el primer gran paso de un equipo que recién empieza y que ya mira a la Copa Oriental, en diciembre, en Punta del Este.",
  "Entrenamos tres veces por semana y la puerta está abierta: no hace falta tener experiencia. Si querés sumarte, escribinos y te prestamos un disco.",
];

// Calendario del año: todos los torneos, pasados y futuros. "logro" es opcional (ej: "🏆 Campeones").
// Agregá acá los demás torneos del año (desde/hasta en formato AÑO-MES-DIA).
const TORNEOS = [
  { nombre: "Copa Primavera", desde: "2026-09-26", hasta: "2026-09-27", lugar: "Florida", logro: "🏆 Campeones" },
  { nombre: "Copa Oriental 2026 · 11.ª edición", desde: "2026-12-04", hasta: "2026-12-06", lugar: "Punta del Este, Maldonado" },
  { nombre: "Ciudad de la Furia · Torneo de Ultimate Mixto", desde: "2027-03-26", hasta: "2027-03-28", lugar: "Argentina" },
];

// nuestros/suyos son opcionales: sin marcador se muestra "Victoria"/"Derrota". Completá los puntajes cuando los tengas.
const RESULTADOS = [
  { fecha: "2026-09-26", rival: "Tordos", nuestros: 15, suyos: 12, torneo: "Copa Primavera · Fase de grupos" },
  { fecha: "2026-09-26", rival: "Flama", nuestros: 12, suyos: 0, torneo: "Copa Primavera · Fase de grupos" },
  { fecha: "2026-09-26", rival: "Mean Machine", nuestros: 15, suyos: 5, torneo: "Copa Primavera · Fase de grupos" },
  { fecha: "2026-09-27", rival: "Flama", nuestros: 15, suyos: 9, torneo: "Copa Primavera · Semifinal" },
  { fecha: "2026-09-27", rival: "Tordos", nuestros: 15, suyos: 6, torneo: "Copa Primavera · Final" },
];

// foto: archivo dentro de assets/jugadores/ (las tarjetas ya traen nombre y apodo dibujados)
const JUGADORES = [
  { nombre: "Ainara Rodriguez", apodo: "Aini", foto: "ainara-rodriguez.webp" },
  { nombre: "Camila Couture", apodo: "Camilinha", foto: "camila-couture.webp" },
  { nombre: "Juanjo Alonso", apodo: "Juano", foto: "juanjo-alonso.webp" },
  { nombre: "Julieta Noguez", apodo: "Ju", foto: "julieta-noguez.webp" },
  { nombre: "Leandro Rodriguez", apodo: "Lean", foto: "leandro-rodriguez.webp" },
  { nombre: "Matilde Rodriguez", apodo: "Matildinha", foto: "matilde-rodriguez.webp" },
  { nombre: "Nicolas Cabana", apodo: "Nico", foto: "nicolas-cabana.webp" },
  { nombre: "Rosina Cordero", apodo: "Rosi", foto: "rosina-cordero.webp" },
  { nombre: "Santiago Rodriguez", apodo: "Santiaginho", foto: "santiago-rodriguez.webp" },
  { nombre: "Sebastian Migdal", apodo: "Seba", foto: "sebastian-migdal.webp" },
  { nombre: "Sofia Rodriguez", apodo: "Sofi", foto: "sofia-rodriguez.webp" },
  { nombre: "Thiago Elizalde", apodo: "Facha", foto: "thiago-elizalde.webp" },
];

// Torneos de la galería. id: se usa en los items de GALERIA (campo "torneo", por defecto "primavera").
const GALERIA_TORNEOS = [
  { id: "primavera", nombre: "Copa Primavera 2026", lugar: "Florida", fecha: "26 y 27 de septiembre", logro: "🏆 Campeones", portada: "torneo/dia2-6346.webp" },
];

// Galería (página galeria.html). tipo: "foto" o "video"; dia: "1", "2" o "previa". Los archivos están en assets/torneo/
const GALERIA = [
  { tipo: "foto", dia: "2", src: "torneo/dia2-6346.webp" },
  { tipo: "foto", dia: "2", src: "torneo/dia2-6317.webp" },
  { tipo: "foto", dia: "2", src: "torneo/dia2-6345.webp" },
  { tipo: "foto", dia: "2", src: "torneo/dia2-6320.webp" },
  { tipo: "foto", dia: "2", src: "torneo/dia2-6331.webp" },
  { tipo: "foto", dia: "1", src: "torneo/dia1-6216.webp" },
  { tipo: "foto", dia: "1", src: "torneo/dia1-6162.webp" },
  { tipo: "video", dia: "1", src: "torneo/dia1-6176.mp4", poster: "torneo/dia1-6176-poster.webp" },
  { tipo: "foto", dia: "1", src: "torneo/dia1-6161.webp" },
  { tipo: "foto", dia: "1", src: "torneo/dia1-6230.webp" },
  { tipo: "video", dia: "1", src: "torneo/dia1-6156.mp4", poster: "torneo/dia1-6156-poster.webp" },
  { tipo: "foto", dia: "1", src: "torneo/dia1-6169.webp" },
  { tipo: "video", dia: "1", src: "torneo/dia1-6168.mp4", poster: "torneo/dia1-6168-poster.webp" },
  { tipo: "foto", dia: "1", src: "torneo/dia1-6170.webp" },
  { tipo: "foto", dia: "1", src: "torneo/dia1-6171.webp" },
  { tipo: "video", dia: "1", src: "torneo/dia1-6164.mp4", poster: "torneo/dia1-6164-poster.webp" },
  { tipo: "video", dia: "1", src: "torneo/dia1-6220.mp4", poster: "torneo/dia1-6220-poster.webp" },
  { tipo: "video", dia: "1", src: "torneo/dia1-6218.mp4", poster: "torneo/dia1-6218-poster.webp" },
  { tipo: "video", dia: "1", src: "torneo/dia1-6202.mp4", poster: "torneo/dia1-6202-poster.webp" },
  { tipo: "video", dia: "1", src: "torneo/dia1-6141.mp4", poster: "torneo/dia1-6141-poster.webp" },
  { tipo: "video", dia: "1", src: "torneo/dia1-6132.mp4", poster: "torneo/dia1-6132-poster.webp" },
  { tipo: "foto", dia: "2", src: "torneo/dia2-6241.webp" },
  { tipo: "foto", dia: "2", src: "torneo/dia2-6243.webp" },
  { tipo: "video", dia: "2", src: "torneo/dia2-6341.mp4", poster: "torneo/dia2-6341-poster.webp" },
  { tipo: "foto", dia: "2", src: "torneo/dia2-6288.webp" },
  { tipo: "foto", dia: "2", src: "torneo/dia2-6293.webp" },
  { tipo: "video", dia: "2", src: "torneo/dia2-6340.mp4", poster: "torneo/dia2-6340-poster.webp" },
  { tipo: "foto", dia: "2", src: "torneo/dia2-6294.webp" },
  { tipo: "foto", dia: "2", src: "torneo/dia2-6295.webp" },
  { tipo: "video", dia: "2", src: "torneo/dia2-6349.mp4", poster: "torneo/dia2-6349-poster.webp" },
  { tipo: "foto", dia: "2", src: "torneo/dia2-6302.webp" },
  { tipo: "foto", dia: "2", src: "torneo/dia2-6301.webp" },
  { tipo: "video", dia: "2", src: "torneo/dia2-6316.mp4", poster: "torneo/dia2-6316-poster.webp" },
  { tipo: "foto", dia: "2", src: "torneo/dia2-6348.webp" },
  { tipo: "video", dia: "2", src: "torneo/dia2-6315.mp4", poster: "torneo/dia2-6315-poster.webp" },
  { tipo: "video", dia: "2", src: "torneo/dia2-6248.mp4", poster: "torneo/dia2-6248-poster.webp" },
  { tipo: "video", dia: "2", src: "torneo/dia2-6251.mp4", poster: "torneo/dia2-6251-poster.webp" },
  { tipo: "video", dia: "2", src: "torneo/dia2-6258.mp4", poster: "torneo/dia2-6258-poster.webp" },
  { tipo: "video", dia: "2", src: "torneo/dia2-6260.mp4", poster: "torneo/dia2-6260-poster.webp" },
  { tipo: "video", dia: "2", src: "torneo/dia2-6284.mp4", poster: "torneo/dia2-6284-poster.webp" },
  { tipo: "video", dia: "2", src: "torneo/dia2-6265.mp4", poster: "torneo/dia2-6265-poster.webp" },
  { tipo: "foto", dia: "previa", src: "torneo/previa-6092.webp" },
  { tipo: "foto", dia: "previa", src: "torneo/previa-6093.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6066.mp4", poster: "torneo/previa-6066-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6067.mp4", poster: "torneo/previa-6067-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6068.mp4", poster: "torneo/previa-6068-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6069.mp4", poster: "torneo/previa-6069-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6070.mp4", poster: "torneo/previa-6070-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6071.mp4", poster: "torneo/previa-6071-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6072.mp4", poster: "torneo/previa-6072-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6073.mp4", poster: "torneo/previa-6073-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6074.mp4", poster: "torneo/previa-6074-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6075.mp4", poster: "torneo/previa-6075-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6076.mp4", poster: "torneo/previa-6076-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6077.mp4", poster: "torneo/previa-6077-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6078.mp4", poster: "torneo/previa-6078-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6079.mp4", poster: "torneo/previa-6079-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6080.mp4", poster: "torneo/previa-6080-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6081.mp4", poster: "torneo/previa-6081-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6082.mp4", poster: "torneo/previa-6082-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6083.mp4", poster: "torneo/previa-6083-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6084.mp4", poster: "torneo/previa-6084-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6085.mp4", poster: "torneo/previa-6085-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6086.mp4", poster: "torneo/previa-6086-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6087.mp4", poster: "torneo/previa-6087-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6088.mp4", poster: "torneo/previa-6088-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6089.mp4", poster: "torneo/previa-6089-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6090.mp4", poster: "torneo/previa-6090-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6094.mp4", poster: "torneo/previa-6094-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6095.mp4", poster: "torneo/previa-6095-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6096.mp4", poster: "torneo/previa-6096-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6097.mp4", poster: "torneo/previa-6097-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6098.mp4", poster: "torneo/previa-6098-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6099.mp4", poster: "torneo/previa-6099-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6100.mp4", poster: "torneo/previa-6100-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6101.mp4", poster: "torneo/previa-6101-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6102.mp4", poster: "torneo/previa-6102-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6103.mp4", poster: "torneo/previa-6103-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6104.mp4", poster: "torneo/previa-6104-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6106.mp4", poster: "torneo/previa-6106-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6107.mp4", poster: "torneo/previa-6107-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6108.mp4", poster: "torneo/previa-6108-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6109.mp4", poster: "torneo/previa-6109-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6110.mp4", poster: "torneo/previa-6110-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6111.mp4", poster: "torneo/previa-6111-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6112.mp4", poster: "torneo/previa-6112-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6113.mp4", poster: "torneo/previa-6113-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6114.mp4", poster: "torneo/previa-6114-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6115.mp4", poster: "torneo/previa-6115-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6116.mp4", poster: "torneo/previa-6116-poster.webp" },
  { tipo: "video", dia: "previa", src: "torneo/previa-6117.mp4", poster: "torneo/previa-6117-poster.webp" },
];

// Recursos de la página Ultimate (ultimate.html). Los PDF y sus portadas están en assets/recursos/
// grupo: "reglas", "visual" o "avanzado". idioma: "ES" o "EN".
const RECURSOS = [
  { grupo: "reglas", titulo: "Reglas de Ultimate 2025–2028", desc: "El reglamento oficial completo de la WFDF: espíritu de juego, campo, puntos, faltas y violaciones.", idioma: "ES", paginas: 20, pdf: "recursos/reglas-ultimate-2025-2028.pdf", portada: "recursos/reglas-ultimate-2025-2028.webp" },
  { grupo: "reglas", titulo: "Reglas de Ultimate Playa 5 vs 5", desc: "El reglamento oficial para jugar en la arena, con las reglas propias de playa resaltadas.", idioma: "ES", paginas: 21, pdf: "recursos/reglas-ultimate-playa-2025-2028.pdf", portada: "recursos/reglas-ultimate-playa-2025-2028.webp" },
  { grupo: "visual", titulo: "Señales de manos", desc: "Los gestos para marcar falta, violación, gol, pasos, pick y más. Ideal para aprender rápido.", idioma: "ES", paginas: 2, pdf: "recursos/senales-de-manos.pdf", portada: "recursos/senales-de-manos.webp" },
  { grupo: "visual", titulo: "Diagramas de decisión", desc: "Árboles de “sí / no” para resolver jugadas dudosas: pull, faltas, recepciones y más.", idioma: "ES", paginas: 8, pdf: "recursos/diagramas-de-decision.pdf", portada: "recursos/diagramas-de-decision.webp" },
  { grupo: "visual", titulo: "Diagramas del pull", desc: "Dónde se pone el disco en juego cuando el pull sale del campo, con dibujos de cada caso.", idioma: "EN", paginas: 4, pdf: "recursos/diagramas-del-pull-2025-2028.pdf", portada: "recursos/diagramas-del-pull-2025-2028.webp" },
  { grupo: "avanzado", titulo: "Anotaciones oficiales", desc: "Explicaciones y ejemplos que aclaran cómo se aplica cada regla en situaciones concretas.", idioma: "EN", paginas: 35, pdf: "recursos/anotaciones-oficiales-2025-2028.pdf", portada: "recursos/anotaciones-oficiales-2025-2028.webp" },
  { grupo: "avanzado", titulo: "Apéndice del reglamento", desc: "Reglas adicionales para campeonatos: medidas del campo, tiempos, observadores y más.", idioma: "EN", paginas: 33, pdf: "recursos/apendice-2025-2028.pdf", portada: "recursos/apendice-2025-2028.webp" },
];
