// Asistencia a prácticas: módulo compartido (carga, cálculo, resumen y mapa de calor) y la página /asistencia (solo lectura).
// Los datos viven en la base y solo los ve quien tiene sesión; modificarlos es solo para admins (lo hace cumplir la base).
const Asistencia = (() => {
  const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fecha = (iso, largo) => new Date(iso + "T00:00").toLocaleDateString("es", largo
    ? { weekday: "long", day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "short" });

  // Pide todas las filas de una consulta, de a 1000 (el límite de la base por respuesta)
  async function pedirTodo(ruta) {
    const filas = [], cab = await Sesion.headers();
    for (let desde = 0; ; desde += 1000) {
      const r = await fetch(`${SUPABASE.url}/rest/v1/${ruta}&limit=1000&offset=${desde}`, { headers: cab, signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? "No tenés permiso para ver esto." : `Error ${r.status}`);
      const lote = await r.json(); filas.push(...lote);
      if (lote.length < 1000) return filas;
    }
  }
  const cargar = async () => {
    const [practicas, jugadores, asistencias] = await Promise.all([
      pedirTodo("practicas?select=id,fecha,lugar,notas&order=fecha.asc,id.asc"),
      pedirTodo("jugadores?select=slug,nombre,apodo,foto,activo&order=nombre.asc"),
      pedirTodo("asistencias?select=practica_id,jugador_slug,presente&order=practica_id.asc,jugador_slug.asc"),
    ]);
    return { practicas, jugadores, asistencias };
  };

  // Totales por jugador, por práctica y del equipo. "Disponibles" = prácticas que contaban para esa persona.
  function calcular({ practicas, jugadores, asistencias }) {
    const porJugador = new Map(jugadores.map((j) => [j.slug, { ...j, disponibles: 0, fue: 0, marcas: new Map() }]));
    const porPractica = new Map(practicas.map((p) => [p.id, { presentes: 0, total: 0 }]));
    for (const a of asistencias) {
      const j = porJugador.get(a.jugador_slug), p = porPractica.get(a.practica_id);
      if (!j || !p) continue;
      j.disponibles++; p.total++; j.marcas.set(a.practica_id, a.presente);
      if (a.presente) { j.fue++; p.presentes++; }
    }
    const lista = [...porJugador.values()].filter((j) => j.disponibles > 0).map((j) => ({ ...j, pct: (100 * j.fue) / j.disponibles }));
    const fue = lista.reduce((s, j) => s + j.fue, 0), disp = lista.reduce((s, j) => s + j.disponibles, 0);
    return { lista, porPractica, equipo: { fue, disp, pct: disp ? (100 * fue) / disp : 0 } };
  }
  const ordenar = (lista, modo) => [...lista].sort((a, b) => (modo === "cantidad" ? b.fue - a.fue || b.pct - a.pct : b.pct - a.pct || b.fue - a.fue) || a.nombre.localeCompare(b.nombre, "es"));
  const clasePct = (p) => (p >= 80 ? "alto" : p >= 60 ? "medio" : "bajo");

  function tarjetas(datos, c, propio) {
    const yo = propio && c.lista.find((j) => j.slug === propio);
    const ult = datos.practicas[datos.practicas.length - 1], u = ult && c.porPractica.get(ult.id);
    return `<div class="asi-tarjetas">
      <div class="asi-t"><b>${datos.practicas.length}</b><span>Prácticas registradas</span></div>
      <div class="asi-t"><b>${Math.round(c.equipo.pct)}%</b><span>Asistencia del equipo</span></div>
      ${yo ? `<div class="asi-t yo"><b>${Math.round(yo.pct)}%</b><span>Tu asistencia · ${yo.fue} de ${yo.disponibles}</span></div>` : ""}
      ${ult ? `<div class="asi-t"><b>${u.presentes}<small>/${u.total}</small></b><span>Última práctica · ${fecha(ult.fecha)}</span></div>` : ""}
    </div>`;
  }

  function tabla(c, propio, modo) {
    const fila = (j, i) => `<tr class="${j.slug === propio ? "yo" : ""}">
      <td class="asi-pos">${i + 1}</td>
      <td><div class="asi-quien"><img src="assets/jugadores/${esc(j.foto)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><span><b>${esc(j.apodo)}</b><small>${esc(j.nombre)}</small></span></div></td>
      <td class="asi-num">${j.fue}<small> de ${j.disponibles}</small></td>
      <td class="asi-barra-celda"><div class="asi-barra ${clasePct(j.pct)}"><i style="width:${j.pct.toFixed(1)}%"></i></div></td>
      <td class="asi-pct ${clasePct(j.pct)}">${Math.round(j.pct)}%</td>
    </tr>`;
    return `<div class="asi-orden"><span>Ordenar por</span>
        <button class="chip ${modo === "pct" ? "on" : ""}" data-orden="pct">Porcentaje</button>
        <button class="chip ${modo === "cantidad" ? "on" : ""}" data-orden="cantidad">Prácticas a las que fue</button></div>
      <div class="asi-tabla"><table>
        <thead><tr><th>#</th><th>Jugador</th><th>Fue</th><th class="asi-barra-celda"></th><th>%</th></tr></thead>
        <tbody>${ordenar(c.lista, modo).map(fila).join("")}</tbody></table></div>
      <p class="asi-nota">El porcentaje cuenta solo las prácticas que había desde que cada uno se sumó al equipo.</p>`;
  }

  function mapa(datos, c, propio, modo) {
    const meses = [];
    for (const p of datos.practicas) {
      const m = +p.fecha.slice(5, 7) - 1, y = p.fecha.slice(0, 4), k = `${y}-${m}`;
      if (!meses.length || meses[meses.length - 1].k !== k) meses.push({ k, nombre: `${MESES[m]} ${y.slice(2)}`, n: 0 });
      meses[meses.length - 1].n++;
    }
    const celda = (j, p) => {
      const v = j.marcas.get(p.id), cls = v === undefined ? "na" : v ? "fue" : "falto";
      return `<td class="m ${cls}" title="${esc(j.apodo)} · ${fecha(p.fecha)}: ${v === undefined ? "no contaba" : v ? "fue" : "faltó"}"></td>`;
    };
    return `<div class="asi-mapa"><table>
      <thead><tr><th></th>${meses.map((m) => `<th colspan="${m.n}" class="mes">${m.nombre}</th>`).join("")}</tr>
      <tr><th></th>${datos.practicas.map((p) => `<th class="dia">${+p.fecha.slice(8)}</th>`).join("")}</tr></thead>
      <tbody>${ordenar(c.lista, modo).map((j) => `<tr class="${j.slug === propio ? "yo" : ""}"><th class="nom">${esc(j.apodo)}</th>${datos.practicas.map((p) => celda(j, p)).join("")}</tr>`).join("")}</tbody>
    </table></div>
    <div class="asi-leyenda"><i class="fue"></i> Fue <i class="falto"></i> Faltó <i class="na"></i> No contaba (todavía no estaba)</div>`;
  }

  // Dibuja el resumen completo dentro de un contenedor y conecta el botón de orden
  function montar(el, datos, { propio } = {}) {
    let modo = "pct";
    const c = calcular(datos);
    const dibujar = () => {
      el.innerHTML = `${tarjetas(datos, c, propio)}
        <h2 class="grupo-ult">Ranking de asistencia</h2>${tabla(c, propio, modo)}
        <h2 class="grupo-ult">Práctica por práctica</h2>${mapa(datos, c, propio, modo)}`;
    };
    el.onclick = (e) => { const b = e.target.closest("[data-orden]"); if (b) { modo = b.dataset.orden; dibujar(); } };
    dibujar();
    return c;
  }

  return { cargar, calcular, montar, fecha, esc };
})();

// Página /asistencia: cualquier jugador con sesión puede verla, pero no modificarla
(async () => {
  const raiz = document.querySelector("#asistencia");
  if (!raiz) return;
  const vacio = (t) => (raiz.innerHTML = `<p class="adm-vacio">${t}</p>`);
  if (typeof SUPABASE === "undefined" || !SUPABASE) return vacio("La asistencia todavía no está disponible en el sitio publicado.");
  if (!(await Sesion.token())) { location.href = "/login"; return; }
  try {
    const datos = await Asistencia.cargar();
    if (!datos.practicas.length) return vacio("Todavía no hay prácticas registradas.");
    const yo = (Sesion.actual() || {}).jugador;
    raiz.innerHTML = `<h1 class="title">Asistencia a <span>prácticas</span></h1><div id="asi-contenido"></div>`;
    Asistencia.montar(raiz.querySelector("#asi-contenido"), datos, { propio: yo });
  } catch (e) { vacio(`No se pudo cargar la asistencia: ${Asistencia.esc(e.message)}`); }
})();
