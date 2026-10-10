// Trackeo de torneos y partidos. Solo administradores.
// La seguridad real está en la base: sin rol admin no se lee ni se escribe nada.
(() => {
  const raiz = document.querySelector("#trackeo");
  if (!raiz) return;

  const esc = (s) => (typeof escHtml === "function" ? escHtml(s) : String(s ?? ""));
  const FASES = ["Grupos", "Pre-cuartos", "Cuartos", "Semifinal", "Final"];
  const TIPOS = [
    ["gol", "Gol"],
    ["asistencia", "Asistencia"],
    ["defensa", "Defensa"],
    ["pase_completado", "Pase completado"],
    ["pase_errado", "Pase errado"],
    ["pase_caido", "Pase caído"],
  ];
  const NOMBRE_TIPO = Object.fromEntries(TIPOS);
  NOMBRE_TIPO.pase_recibido = "Pase recibido";
  let modo = "pase_completado";
  let esperando = null;
  let cambio = null;
  let seguirTrackeo = null;
  let formTorneo = false;
  let formJugador = false;
  let reloj = null;
  let seq = 0;
  let ocupado = false;

  const burger = document.querySelector("#burger"), menu = document.querySelector("#menu");
  if (burger && menu) {
    burger.onclick = () => menu.classList.toggle("open");
    menu.addEventListener("click", () => menu.classList.remove("open"));
  }
  const anio = document.querySelector("#year");
  if (anio) anio.textContent = String(new Date().getFullYear());

  function aviso(texto, mal) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = texto; t.style.borderColor = mal ? "#ff4d6d" : "#2ecc71";
    t.classList.remove("ver"); void t.offsetWidth; t.classList.add("ver");
  }
  const pararReloj = () => { if (reloj) clearInterval(reloj); reloj = null; };
  const slugDe = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const corto = (j) => j.apodo || j.nombre.split(" ")[0];
  const relojTxt = (seg) => {
    const s = Math.max(0, seg | 0);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };
  const segJugados = (partido, hasta) => {
    if (!partido.inicio_en) return 0;
    return Math.max(0, Math.round((hasta.getTime() - new Date(partido.inicio_en).getTime()) / 1000));
  };
  const pct = (n, d) => (d ? Math.round((100 * n) / d) : null);
  const pctTxt = (n) => (n == null ? "–" : `${n}<span class="trk-pct">%</span>`);
  const ruta = () => {
    const h = location.hash.replace(/^#/, "");
    const t = h.match(/^t-(\d+)(?:-(roster|partidos|resumen))?$/);
    if (t) return { tipo: "torneo", id: +t[1], tab: t[2] || "partidos" };
    const p = h.match(/^p-(\d+)$/);
    if (p) return { tipo: "partido", id: +p[1] };
    return { tipo: "lista" };
  };

  async function api(rutaApi, opciones = {}) {
    const r = await fetch(`${SUPABASE.url}/rest/v1/${rutaApi}`, {
      ...opciones,
      headers: { ...(await Sesion.headers()), Prefer: "return=representation", ...(opciones.headers || {}) },
      signal: AbortSignal.timeout(8000),
    });
    if (r.status === 401) { location.href = "/login"; throw new Error("sesión"); }
    if (!r.ok) {
      let c = {}; try { c = await r.json(); } catch (e) {}
      if (r.status === 403) throw new Error("No tenés permiso para hacer eso.");
      throw new Error(c.message || `Error ${r.status}`);
    }
    const texto = await r.text();
    return texto ? JSON.parse(texto) : null;
  }

  function vacio(tipo) {
    return { gol: 0, asistencia: 0, defensa: 0, pase_completado: 0, pase_errado: 0, pase_recibido: 0, pase_caido: 0, puntos: 0, ataque: 0, defensaPts: 0, favor: 0, contra: 0, segundos: 0 };
  }
  // Cierra el cálculo de un conjunto de puntos ya terminados.
  function resumir(puntos, nombres) {
    const porId = new Map();
    const fila = (id) => {
      if (!porId.has(id)) porId.set(id, { id, ...vacio(), nombre: nombres.get(id) || "Jugador" });
      return porId.get(id);
    };
    const equipo = vacio();
    let holdsJugados = 0, holds = 0, breaksJugados = 0, breaks = 0, segundos = 0, conTiempo = 0;
    for (const p of puntos) {
      if (!p.resultado) continue;
      const favor = p.resultado === "favor";
      if (p.lado === "ataque") { holdsJugados++; if (favor) holds++; }
      else { breaksJugados++; if (favor) breaks++; }
      if (p.duracion_seg != null) { segundos += p.duracion_seg; conTiempo++; }
      const linea = new Set((p.track_linea || []).map((l) => l.jugador_id));
      for (const id of linea) {
        const f = fila(id);
        f.puntos++;
        if (p.lado === "ataque") f.ataque++; else f.defensaPts++;
        if (favor) f.favor++; else f.contra++;
        if (p.duracion_seg != null) f.segundos += p.duracion_seg;
      }
      for (const ev of p.track_eventos || []) {
        if (!NOMBRE_TIPO[ev.tipo]) continue;
        fila(ev.jugador_id)[ev.tipo]++;
        equipo[ev.tipo]++;
      }
    }
    const jugadores = [...porId.values()].sort((a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"));
    const cerrados = puntos.filter((p) => p.resultado);
    return {
      jugadores,
      equipo,
      favor: cerrados.filter((p) => p.resultado === "favor").length,
      contra: cerrados.filter((p) => p.resultado === "contra").length,
      total: cerrados.length,
      holds, holdsJugados, breaks, breaksJugados,
      promedio: conTiempo ? Math.round(segundos / conTiempo) : null,
    };
  }

  function tarjetas(r) {
    const intento = r.equipo.pase_completado + r.equipo.pase_errado;
    const recep = r.equipo.pase_recibido + r.equipo.pase_caido;
    const porPunto = (n) => (r.total ? (n / r.total).toFixed(1) : "–");
    return `
      <div class="trk-cards">
        <div class="trk-card"><span class="trk-tip" data-info="Puntos a favor y en contra.">Puntos</span><b>${r.favor}–${r.contra}</b></div>
        <div class="trk-card"><span class="trk-tip" data-info="Porcentaje de puntos ganados cuando Escándalo atacaba.">Holds</span><b>${pctTxt(pct(r.holds, r.holdsJugados))}</b><small>${r.holds}/${r.holdsJugados} en ataque</small></div>
        <div class="trk-card"><span class="trk-tip" data-info="Porcentaje de puntos ganados cuando Escándalo defendía.">Breaks</span><b>${pctTxt(pct(r.breaks, r.breaksJugados))}</b><small>${r.breaks}/${r.breaksJugados} en defensa</small></div>
        <div class="trk-card"><span class="trk-tip" data-info="Cuánto duró cada punto, en promedio.">Punto promedio</span><b>${r.promedio == null ? "–" : relojTxt(r.promedio)}</b></div>
        <div class="trk-card"><span class="trk-tip" data-info="Pases completados sobre completados más errados.">Pases</span><b>${pctTxt(pct(r.equipo.pase_completado, intento))}</b><small>${r.equipo.pase_completado}/${intento} completados</small></div>
        <div class="trk-card"><span class="trk-tip" data-info="Recibidos sobre recibidos más caídos. Un gol también cuenta como recibido.">Recepción</span><b>${pctTxt(pct(r.equipo.pase_recibido, recep))}</b><small>${r.equipo.pase_recibido} recibidos · ${r.equipo.pase_caido} caídos</small></div>
        <div class="trk-card"><span class="trk-tip" data-info="Goles totales.">Goles</span><b>${r.equipo.gol}</b></div>
        <div class="trk-card"><span class="trk-tip" data-info="Asistencias totales.">Asistencias</span><b>${r.equipo.asistencia}</b></div>
        <div class="trk-card"><span class="trk-tip" data-info="Bloqueos totales y el promedio por punto.">Defensas</span><b>${r.equipo.defensa}</b><small>${porPunto(r.equipo.defensa)} por punto</small></div>
      </div>`;
  }

  function tabla(r, conDetalle) {
    if (!r.jugadores.length) return `<p class="trk-ayuda">Todavía no hay puntos cerrados.</p>`;
    const fila = (j) => {
      const intento = j.pase_completado + j.pase_errado;
      const recep = j.pase_recibido + j.pase_caido;
      const dif = j.favor - j.contra;
      const partes = String(j.nombre || "").trim().split(/\s+/);
      const apellido = partes.length > 1 ? partes.pop() : "";
      const difCls = dif > 0 ? "trk-mas" : dif < 0 ? "trk-menos" : "trk-cero";
      return `<tr class="${conDetalle ? "trk-fila" : ""}" ${conDetalle ? `data-acc="jugador" data-jugador="${j.id}"` : ""}>
        <td><span class="trk-quien"><b>${esc(partes.join(" ") || j.nombre)}</b>${apellido ? `<small>${esc(apellido)}</small>` : ""}</span></td>
        <td>${j.puntos}<span class="trk-de">/${r.total}</span></td>
        <td>${pctTxt(pct(j.puntos, r.total))}</td>
        <td>${j.ataque}</td>
        <td>${j.defensaPts}</td>
        <td class="${difCls}">${dif > 0 ? "+" : ""}${dif}</td>
        <td>${j.gol}</td>
        <td>${j.asistencia}</td>
        <td>${j.defensa}</td>
        <td>${j.pase_completado}<span class="trk-de">/${intento || 0}</span></td>
        <td>${pctTxt(pct(j.pase_completado, intento))}</td>
        <td>${j.pase_recibido}</td>
        <td>${j.pase_caido}</td>
        <td>${pctTxt(pct(j.pase_recibido, recep))}</td>
      </tr>`;
    };
    return `<div class="adm-tabla"><table>
      <thead><tr>
        <th class="trk-tip" data-info="">Jugador</th>
        <th class="trk-tip" data-info="Puntos jugados sobre el total.">Puntos</th>
        <th class="trk-tip" data-info="Porcentaje de los puntos en los que entró.">%</th>
        <th class="trk-tip" data-info="Puntos jugados en ataque.">PA</th>
        <th class="trk-tip" data-info="Puntos jugados en defensa.">PD</th>
        <th class="trk-tip" data-info="Puntos a favor menos puntos en contra mientras estuvo en cancha.">+/−</th>
        <th class="trk-tip" data-info="Goles.">G</th>
        <th class="trk-tip" data-info="Asistencias.">A</th>
        <th class="trk-tip" data-info="Defensas.">D</th>
        <th class="trk-tip" data-info="Pases completados sobre completados más errados.">Pases</th>
        <th class="trk-tip" data-info="Porcentaje de pases completados.">% pase</th>
        <th class="trk-tip" data-info="Pases que recibió.">Recepc.</th>
        <th class="trk-tip" data-info="Pases que se le cayeron.">Caídos</th>
        <th class="trk-tip" data-info="Porcentaje de recepción.">% rec.</th>
      </tr></thead>
      <tbody>${r.jugadores.map(fila).join("")}</tbody>
    </table></div>
    <p class="trk-ayuda">${conDetalle ? "Tocá un jugador para ver qué hizo en cada punto. " : ""}Pases es completados sobre completados + errados. Recepción es recibidos sobre recibidos + caídos. +/− suma un punto a favor o en contra por cada punto jugado.</p>`;
  }

  function marcadorDe(puntos) {
    const cerrados = puntos.filter((p) => p.resultado);
    return {
      favor: cerrados.filter((p) => p.resultado === "favor").length,
      contra: cerrados.filter((p) => p.resultado === "contra").length,
    };
  }

  async function vistaLista() {
    const torneos = await api("track_torneos?select=id,nombre,lugar,desde,track_partidos(id,fase)&order=creado_en.desc");
    raiz.innerHTML = `
      <div class="adm-cab">
        <div><h1>Trackeo</h1><p>Armás el torneo, marcás quién juega y trackeás cada punto.</p></div>
        <button class="btn" type="button" data-acc="form-torneo">${formTorneo ? "Cerrar" : "Nuevo torneo"}</button>
      </div>
      ${formTorneo ? `
        <form class="trk-form adm-form" data-form="torneo">
          <label>Nombre<input name="nombre" required maxlength="80" placeholder="Copa Oriental 2026"></label>
          <label class="adm-check"><input name="unico" type="checkbox"> Partido único, sin armar un torneo</label>
          <div class="trk-unico" hidden>
            <label>Rival<input name="rival" maxlength="80" placeholder="Equipo rival"></label>
            <label>Tiempo del partido<input name="duracion_min" type="number" min="10" max="180" inputmode="numeric" placeholder="Minutos, por ejemplo 75"></label>
          </div>
          <div class="adm-fila">
            <label>Lugar<input name="lugar" maxlength="80" placeholder="Punta del Este"></label>
            <label>Desde<input name="desde" type="date"></label>
          </div>
          <button class="btn" type="submit">Crear torneo</button>
        </form>` : ""}
      <div class="trk-lista">
        ${torneos.length ? torneos.map((t) => `
          <a class="trk-torneo" href="#t-${t.id}">
            <span><b>${esc(t.nombre)}</b><small>${esc(t.lugar || "Sin lugar")}${t.desde ? " · " + esc(t.desde) : ""}</small></span>
            <small>${(t.track_partidos || []).length === 1 && t.track_partidos[0].fase === "Amistoso" ? "Partido único" : `${(t.track_partidos || []).length} partidos`}</small>
          </a>`).join("") : `<p class="adm-vacio">Todavía no hay torneos trackeados.</p>`}
      </div>`;
  }

  async function vistaTorneo(r) {
    const [torneo] = await api(`track_torneos?id=eq.${r.id}&select=id,nombre,lugar,desde,hasta`);
    if (!torneo) { raiz.innerHTML = `<p class="adm-vacio">Ese torneo no está.</p>`; return; }
    const tab = (nombre, etq) => `<a class="${r.tab === nombre ? "on" : ""}" href="#t-${torneo.id}-${nombre}">${etq}</a>`;
    let cuerpo = "";
    if (r.tab === "roster") cuerpo = await htmlRoster(torneo);
    else if (r.tab === "resumen") cuerpo = await htmlResumen(torneo);
    else cuerpo = await htmlPartidos(torneo);
    raiz.innerHTML = `
      <div class="adm-cab">
        <div><h1>${esc(torneo.nombre)}</h1><p>${esc(torneo.lugar || "Trackeo del torneo")}</p></div>
        <a class="btn ghost" href="#trackeo">Todos los torneos</a>
      </div>
      <nav class="trk-tabs">${tab("roster", "Roster")}${tab("partidos", "Partidos")}${tab("resumen", "Resumen")}</nav>
      ${cuerpo}`;
  }

  async function htmlRoster(torneo) {
    const [roster, plantel] = await Promise.all([
      api(`track_roster?torneo_id=eq.${torneo.id}&select=juega,jugador_id,jugadores(id,nombre,apodo,numero)`),
      api("jugadores?invitado=eq.false&select=id,nombre,apodo,numero,activo&order=nombre.asc"),
    ]);
    const enRoster = new Set(roster.map((x) => x.jugador_id));
    const juegan = roster.filter((x) => x.juega).length;
    const fuera = plantel.filter((j) => !enRoster.has(j.id));
    const chip = (x) => {
      const j = x.jugadores;
      return `<button type="button" class="trk-chip${x.juega ? " on" : ""}" data-acc="juega" data-jugador="${j.id}" data-juega="${x.juega ? "1" : "0"}">${esc(j.nombre)}${j.numero != null ? ` <small>#${j.numero}</small>` : ""}</button>`;
    };
    return `
      <p class="trk-ayuda">${juegan} juegan este torneo. Tocá un nombre para dejarlo adentro o afuera. En los partidos solo aparecen los que juegan.</p>
      <div class="trk-plantel">${roster.map(chip).join("") || `<p class="trk-ayuda">El roster está vacío.</p>`}</div>
      ${fuera.length ? `<p class="trk-ayuda">Del plantel, todavía no están en este torneo:</p>
        <div class="trk-plantel">${fuera.map((j) => `<button type="button" class="trk-chip" data-acc="sumar" data-jugador="${j.id}">+ ${esc(j.nombre)}</button>`).join("")}</div>` : ""}
      <button class="btn ghost" type="button" data-acc="form-jugador">${formJugador ? "Cerrar" : "Agregar jugador nuevo"}</button>
      ${formJugador ? `
        <form class="trk-form adm-form" data-form="jugador" data-torneo="${torneo.id}">
          <label>Nombre<input name="nombre" required maxlength="80" placeholder="Nombre y apellido"></label>
          <label>Apodo<input name="apodo" maxlength="40" placeholder="Opcional"></label>
          <p class="trk-ayuda">Queda solo en este torneo. No entra al roster del equipo ni a los otros torneos.</p>
          <button class="btn" type="submit">Agregar a este torneo</button>
        </form>` : ""}
      <p style="margin-top:18px"><button class="btn ghost peligro" type="button" data-acc="borrar-torneo" data-torneo="${torneo.id}">Borrar torneo</button></p>`;
  }

  async function htmlPartidos(torneo) {
    const partidos = await api(`track_partidos?torneo_id=eq.${torneo.id}&select=id,rival,fase,estado,duracion_min,creado_en,track_puntos(resultado)&order=creado_en.asc`);
    const unico = partidos.length === 1 && partidos[0].fase === "Amistoso";
    const borrar = `<p style="margin-top:18px"><button class="btn ghost peligro" type="button" data-acc="borrar-torneo" data-torneo="${torneo.id}">Borrar torneo</button></p>`;
    return `
      ${unico ? "" : `
      <form class="trk-form adm-form" data-form="partido" data-torneo="${torneo.id}">
        <div class="adm-fila">
          <label>Rival<input name="rival" required maxlength="80" placeholder="Equipo rival"></label>
          <label>Fase<select name="fase">${FASES.map((f) => `<option>${esc(f)}</option>`).join("")}</select></label>
        </div>
        <label>Tiempo del partido<input name="duracion_min" type="number" required min="10" max="180" inputmode="numeric" placeholder="Minutos, por ejemplo 75"></label>
        <p class="trk-ayuda">El reloj total arranca con el primer punto. El medio tiempo se marca a los 8 goles, o cuando lo marques vos.</p>
        <button class="btn" type="submit">Nuevo partido</button>
      </form>`}
      <div class="trk-partidos">
        ${partidos.length ? partidos.map((p) => {
          const m = marcadorDe(p.track_puntos || []);
          return `<a class="trk-partido" href="#p-${p.id}">
            <span><b>${esc(p.rival)}</b><small>${unico ? "Partido único" : esc(p.fase)}${p.duracion_min ? ` · ${p.duracion_min} min` : ""} · ${p.estado === "finalizado" ? "Finalizado" : "En juego"}</small></span>
            <b>${m.favor}–${m.contra}</b>
          </a>`;
        }).join("") : `<p class="trk-ayuda">Todavía no hay partidos en este torneo.</p>`}
      </div>
      ${borrar}`;
  }

  async function htmlResumen(torneo) {
    const partidos = await api(`track_partidos?torneo_id=eq.${torneo.id}&select=id,rival,fase,estado,track_puntos(resultado,lado,duracion_seg,track_linea(jugador_id),track_eventos(jugador_id,tipo))&order=creado_en.asc`);
    const roster = await api(`track_roster?torneo_id=eq.${torneo.id}&select=jugador_id,jugadores(nombre)`);
    const nombres = new Map(roster.map((x) => [x.jugador_id, x.jugadores.nombre]));
    const puntos = partidos.flatMap((p) => p.track_puntos || []);
    const r = resumir(puntos, nombres);
    let ganados = 0, perdidos = 0, empates = 0;
    for (const p of partidos) {
      if (p.estado !== "finalizado") continue;
      const m = marcadorDe(p.track_puntos || []);
      if (m.favor > m.contra) ganados++;
      else if (m.favor < m.contra) perdidos++;
      else empates++;
    }
    return `
      <div class="trk-cards">
        <div class="trk-card"><span>Partidos</span><b>${ganados}–${perdidos}</b><small>${empates ? empates + " empates · " : ""}${partidos.length} en el torneo</small></div>
      </div>
      ${tarjetas(r)}
      ${tabla(r)}`;
  }

  async function vistaPartido(id) {
    const [partido] = await api(`track_partidos?id=eq.${id}&select=id,torneo_id,rival,fase,estado,duracion_min,inicio_en,finalizado_en,medio_en,medio_motivo,descanso_seg,descanso_inicio,reanudado_en,cierre,track_torneos(nombre)`);
    if (!partido) { raiz.innerHTML = `<p class="adm-vacio">Ese partido no está.</p>`; return; }
    const [puntos, roster] = await Promise.all([
      api(`track_puntos?partido_id=eq.${id}&select=id,nro,lado,resultado,duracion_seg,iniciado_en,track_linea(jugador_id),track_eventos(id,jugador_id,tipo)&order=nro.asc`),
      api(`track_roster?torneo_id=eq.${partido.torneo_id}&juega=eq.true&select=jugador_id,jugadores(id,nombre,apodo,numero)`),
    ]);
    const nombres = new Map(roster.map((x) => [x.jugador_id, x.jugadores]));
    for (const p of puntos) for (const l of p.track_linea || []) if (!nombres.has(l.jugador_id)) nombres.set(l.jugador_id, { id: l.jugador_id, nombre: "Jugador", apodo: "Jugador" });
    const m = marcadorDe(puntos);
    const abierto = puntos.find((p) => !p.resultado);
    const ultimo = [...puntos].reverse().find((p) => p.resultado);
    const sugerida = new Set((ultimo?.track_linea || []).map((l) => l.jugador_id).slice(0, 7));
    if (!abierto || (cambio && cambio.puntoId !== abierto.id)) cambio = null;
    const ladoSugerido = ultimo ? (ultimo.resultado === "favor" ? "defensa" : "ataque") : "ataque";
    if (!partido.inicio_en && puntos.length) {
      partido.inicio_en = puntos.map((p) => p.iniciado_en).sort()[0];
      await api(`track_partidos?id=eq.${partido.id}`, { method: "PATCH", body: JSON.stringify({ inicio_en: partido.inicio_en }) });
    }
    let enJuego = partido.estado !== "finalizado";
    const aQuince = m.favor >= 15 || m.contra >= 15;
    if (!aQuince) seguirTrackeo = null;
    if (!enJuego && !abierto && !aQuince && partido.cierre !== "manual") {
      partido.estado = "abierto";
      partido.finalizado_en = null;
      partido.cierre = null;
      enJuego = true;
      await api(`track_partidos?id=eq.${partido.id}`, { method: "PATCH", body: JSON.stringify({ estado: "abierto", finalizado_en: null, cierre: null }) });
    }
    if (enJuego && !abierto && aQuince && seguirTrackeo !== partido.id) {
      partido.estado = "finalizado";
      partido.finalizado_en = new Date().toISOString();
      partido.cierre = "quince";
      enJuego = false;
      await api(`track_partidos?id=eq.${partido.id}`, { method: "PATCH", body: JSON.stringify({ estado: "finalizado", finalizado_en: partido.finalizado_en, cierre: "quince" }) });
      aviso(m.favor > m.contra ? "Ganó Escándalo." : `Ganó ${partido.rival}.`);
    }
    const aOcho = m.favor >= 8 || m.contra >= 8;
    if (enJuego && !abierto && !partido.medio_en && aOcho) {
      partido.medio_en = new Date().toISOString();
      partido.medio_motivo = "goles";
      await api(`track_partidos?id=eq.${partido.id}`, { method: "PATCH", body: JSON.stringify({ medio_en: partido.medio_en, medio_motivo: "goles" }) });
    } else if (partido.medio_en && partido.medio_motivo === "goles" && !partido.descanso_inicio && !aOcho) {
      partido.medio_en = null;
      partido.medio_motivo = null;
      await api(`track_partidos?id=eq.${partido.id}`, { method: "PATCH", body: JSON.stringify({ medio_en: null, medio_motivo: null }) });
    }
    const resumen = resumir(puntos, new Map([...nombres].map(([k, v]) => [k, v.nombre])));
    const ya = new Set(resumen.jugadores.map((j) => j.id));
    for (const x of roster) {
      const j = x.jugadores;
      if (!j || ya.has(j.id)) continue;
      resumen.jugadores.push({ id: j.id, ...vacio(), nombre: j.nombre });
    }
    resumen.jugadores.sort((a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre, "es"));
    detallePartido = { puntos, nombres };
    const finReloj = !enJuego && partido.finalizado_en ? new Date(partido.finalizado_en) : new Date();
    const segTotal = segJugados(partido, finReloj);
    const enDescanso = !!(partido.medio_en && !partido.reanudado_en);
    raiz.innerHTML = `
      <div class="adm-cab">
        <div><h1>${esc(partido.track_torneos.nombre)}</h1><p>${esc(partido.fase)} contra ${esc(partido.rival)}</p></div>
        <a class="btn ghost" href="#t-${partido.torneo_id}-partidos">Partidos</a>
      </div>
      <div class="trk-marcador">
        <div class="trk-nos"><small>Escándalo</small><b>${m.favor}–${m.contra}</b></div>
        <div class="trk-tiempo">
          <small>Tiempo</small>
          <b class="trk-total" data-inicio="${esc(partido.inicio_en || "")}" data-fin="${enJuego ? "" : esc(partido.finalizado_en || "")}">${partido.inicio_en ? relojTxt(segTotal) : "00:00"}</b>
          <small>${partido.duracion_min ? `de ${partido.duracion_min} min` : "Sin tiempo cargado"}</small>
        </div>
        <div style="text-align:right"><small>${esc(partido.rival)}</small><div>${partido.estado !== "finalizado" ? "En juego" : m.favor >= 15 && m.favor > m.contra ? "Ganó Escándalo" : m.contra >= 15 && m.contra > m.favor ? "Ganó " + esc(partido.rival) : "Finalizado"}</div></div>
      </div>
      ${abierto ? htmlPuntoAbierto(abierto, nombres, roster) : partido.estado === "finalizado" ? htmlCerrado(partido, puntos, nombres) : enDescanso ? htmlDescanso(partido) : htmlArmar(roster, ladoSugerido, sugerida, ultimo, !partido.medio_en)}
      ${partido.estado === "finalizado" && ultimo ? `<p class="trk-borrar-punto"><button class="btn ghost" type="button" data-acc="borrar-punto" data-punto="${ultimo.id}">Borrar último punto</button></p>` : ""}
      <h2>Resumen del partido</h2>
      ${tarjetas(resumen)}
      ${tabla(resumen, true)}
      <p style="margin-top:16px"><button class="btn ghost peligro" type="button" data-acc="borrar-partido" data-partido="${partido.id}" data-torneo="${partido.torneo_id}">Borrar partido</button></p>`;
    if (enJuego && (abierto || partido.inicio_en || partido.descanso_inicio)) empezarReloj();
  }

  function htmlArmar(roster, lado, sugerida, ultimo, conMedio) {
    if (!roster.length) return `<p class="trk-ayuda">Nadie está marcado como que juega este torneo. Volvé al roster y elegí el plantel.</p>`;
    const marcados = roster.filter((x) => sugerida.has(x.jugadores.id)).length;
    return `
      <p class="trk-ayuda">Elegí si Escándalo ataca o defiende y los 7 que entran. Después empezá el punto.</p>
      <div class="trk-lados">
        <button type="button" class="trk-lado trk-tip${lado === "ataque" ? " on" : ""}" data-acc="lado" data-lado="ataque" data-info="">Ataque</button>
        <button type="button" class="trk-lado def trk-tip${lado === "defensa" ? " on" : ""}" data-acc="lado" data-lado="defensa" data-info="">Defensa</button>
      </div>
      <p class="trk-cuenta trk-ayuda">${marcados}/7 en cancha</p>
      <div class="trk-plantel">
        ${roster.map((x) => {
          const j = x.jugadores;
          const on = sugerida.has(j.id);
          return `<button type="button" class="trk-chip${on ? " on" : ""}" data-acc="linea" data-jugador="${j.id}">${esc(corto(j))}${j.numero != null ? ` <small>#${j.numero}</small>` : ""}</button>`;
        }).join("")}
      </div>
      <div class="trk-botones">
        <button class="btn" type="button" data-acc="empezar"${marcados === 7 ? "" : " disabled"}>Empezar punto</button>
        ${conMedio ? `<button class="btn ghost" type="button" data-acc="medio" data-partido="${ruta().id}">Medio tiempo</button>` : ""}
        <button class="btn ghost" type="button" data-acc="finalizar" data-partido="${ruta().id}">Finalizar partido</button>
        ${ultimo ? `<button class="btn ghost" type="button" data-acc="borrar-punto" data-punto="${ultimo.id}">Borrar último punto</button>` : ""}
      </div>`;
  }

  function htmlPuntoAbierto(punto, nombres, roster) {
    const linea = punto.track_linea || [];
    const eventos = [...(punto.track_eventos || [])].sort((a, b) => b.id - a.id);
    const cuenta = (id) => eventos.filter((e) => e.jugador_id === id).length;
    const enCambio = cambio && cambio.puntoId === punto.id;
    const eligiendo = !enCambio && esperando && esperando.puntoId === punto.id;
    const ya = eligiendo ? (nombres.get(esperando.ya) || { nombre: "Jugador" }) : null;
    const sale = enCambio && cambio.sale ? (nombres.get(cambio.sale) || { nombre: "Jugador" }) : null;
    const enLinea = new Set(linea.map((l) => l.jugador_id));
    const banca = (roster || []).map((x) => x.jugadores).filter((j) => j && !enLinea.has(j.id));
    const ayuda = enCambio
      ? (sale ? `Tocá a quién entra por ${esc(corto(sale))}.` : "Tocá a quién sale.")
      : !eligiendo
        ? "Elegí la acción y tocá a quién. La acción queda elegida para el siguiente toque."
        : esperando.paso === "punto-gol"
          ? "¿Quién hizo el gol?"
          : esperando.paso === "punto-asistencia"
            ? `¿Quién dio la asistencia${ya ? ` del gol de ${esc(corto(ya))}` : ""}? Puede ser la misma persona.`
            : esperando.paso === "gol"
              ? `¿Quién se lo pasó a ${esc(corto(ya))}?`
              : esperando.paso === "asistencia"
                ? `¿Quién hizo el gol del pase de ${esc(corto(ya))}?`
                : `¿A quién le llegó el pase de ${esc(corto(ya))}?`;
    return `
      <div class="trk-marcador">
        <div><small>Punto ${punto.nro} · ${punto.lado === "ataque" ? "PJA" : "PJD"}</small><div class="trk-cron" data-inicio="${esc(punto.iniciado_en)}">00:00</div></div>
        <button class="btn ghost" type="button" data-acc="cancelar" data-punto="${punto.id}">Cancelar punto</button>
      </div>
      <p class="trk-ayuda">${ayuda}</p>
      <div class="trk-acciones${eligiendo || enCambio ? " trk-espera" : ""}">
        ${TIPOS.map(([id, etq]) => `<button type="button" class="trk-modo${modo === id && !enCambio ? " on" : ""}" data-acc="modo" data-tipo="${id}">${etq}</button>`).join("")}
      </div>
      <div class="trk-plantel">
        ${linea.map((l) => {
          const j = nombres.get(l.jugador_id) || { nombre: "Jugador", apodo: "Jugador" };
          const n = cuenta(l.jugador_id);
          const puedeSerElMismo = esperando && (esperando.paso === "gol" || esperando.paso === "asistencia" || esperando.paso === "punto-asistencia");
          const esYa = eligiendo && !puedeSerElMismo && l.jugador_id === esperando.ya;
          const esSale = enCambio && cambio.sale === l.jugador_id;
          const acc = enCambio ? (cambio.sale ? "lanzador" : "sale") : esYa ? "lanzador" : eligiendo ? "recibir" : "anotar";
          return `<button type="button" class="trk-chip${esSale || esYa ? " trk-lanzo" : " on"}" data-acc="${acc}" data-jugador="${l.jugador_id}">${esc(corto(j))}${n ? ` <small>${n}</small>` : ""}</button>`;
        }).join("")}
      </div>
      ${enCambio && sale ? `<p class="trk-ayuda">Entra por ${esc(corto(sale))}</p>
        <div class="trk-plantel">${banca.length ? banca.map((j) => `<button type="button" class="trk-chip" data-acc="entra" data-jugador="${j.id}">${esc(corto(j))}${j.numero != null ? ` <small>#${j.numero}</small>` : ""}</button>`).join("") : `<p class="trk-ayuda">No hay nadie más marcado para jugar este torneo.</p>`}</div>` : ""}
      <div class="trk-log">
        ${eventos.length ? eventos.map((e) => `<div>${esc(NOMBRE_TIPO[e.tipo] || e.tipo)} · ${esc(corto(nombres.get(e.jugador_id) || { nombre: "Jugador" }))}</div>`).join("") : `<div>Sin acciones todavía.</div>`}
      </div>
      <div class="trk-botones">
        <button class="btn ghost" type="button" data-acc="deshacer" data-punto="${punto.id}" ${eventos.length && !enCambio ? "" : "disabled"}>Deshacer</button>
        <button class="btn ghost" type="button" data-acc="${enCambio ? "cancelar-cambio" : "cambio"}" data-punto="${punto.id}">${enCambio ? "Cancelar cambio" : "Cambiar jugador"}</button>
      </div>
      <div class="trk-cerrar">
        <button class="favor" type="button" data-acc="cerrar" data-punto="${punto.id}" data-resultado="favor" data-inicio="${esc(punto.iniciado_en)}">Punto de Escándalo</button>
        <button class="contra" type="button" data-acc="cerrar" data-punto="${punto.id}" data-resultado="contra" data-inicio="${esc(punto.iniciado_en)}">Punto del rival</button>
      </div>`;
  }

  function htmlDescanso(partido) {
    const titulo = partido.medio_motivo === "goles" ? "Medio tiempo · a 8 goles" : "Medio tiempo";
    if (!partido.descanso_inicio) {
      return `
        <div class="trk-descanso">
          <h2>${titulo}</h2>
          <p class="trk-ayuda">El tiempo del partido sigue. Elegí cuánto dura el descanso.</p>
          <div class="trk-minutos">
            ${[4, 5, 6, 8, 10].map((m) => `<button class="btn" type="button" data-acc="descanso" data-min="${m}" data-partido="${partido.id}">${m} min</button>`).join("")}
          </div>
        </div>`;
    }
    const hasta = new Date(new Date(partido.descanso_inicio).getTime() + partido.descanso_seg * 1000).toISOString();
    const queda = Math.max(0, Math.round((new Date(hasta).getTime() - Date.now()) / 1000));
    return `
      <div class="trk-descanso">
        <h2>${titulo}</h2>
        <p class="trk-ayuda">Descanso</p>
        <div class="trk-cron trk-atras" data-hasta="${esc(hasta)}">${relojTxt(queda)}</div>
        <p class="trk-ayuda" data-fin-descanso ${queda ? "hidden" : ""}>Se terminó el descanso.</p>
        <button class="btn" type="button" data-acc="seguir" data-partido="${partido.id}">Seguir el partido</button>
      </div>`;
  }

  function htmlCerrado(partido, puntos) {
    const m = marcadorDe(puntos);
    const gano = m.favor >= 15 && m.favor > m.contra ? "Ganó Escándalo." : m.contra >= 15 && m.contra > m.favor ? `Ganó ${esc(partido.rival)}.` : "";
    return `
      <p class="trk-ayuda">${gano ? gano + " A 15 se termina el partido." : "Partido finalizado."} Podés seguir trackeando si faltó algo.</p>
      <button class="btn" type="button" data-acc="reabrir" data-partido="${partido.id}">Seguir trackeando</button>
      <p class="trk-ayuda trk-cerrados">${puntos.filter((p) => p.resultado).length} puntos cerrados.</p>`;
  }

  function empezarReloj() {
    pararReloj();
    const tick = () => {
      const punto = raiz.querySelector(".trk-cron:not(.trk-atras)");
      const total = raiz.querySelector(".trk-total");
      const atras = raiz.querySelector(".trk-atras");
      if (!punto && !total && !atras) { pararReloj(); return; }
      const ahora = Date.now();
      if (punto?.dataset.inicio) punto.textContent = relojTxt(Math.round((ahora - new Date(punto.dataset.inicio).getTime()) / 1000));
      if (total?.dataset.inicio && !total.dataset.fin) {
        total.textContent = relojTxt(Math.max(0, Math.round((ahora - new Date(total.dataset.inicio).getTime()) / 1000)));
      }
      if (atras?.dataset.hasta) {
        const queda = Math.max(0, Math.round((new Date(atras.dataset.hasta).getTime() - ahora) / 1000));
        atras.textContent = relojTxt(queda);
        const fin = raiz.querySelector("[data-fin-descanso]");
        if (fin) fin.hidden = queda > 0;
      }
    };
    tick();
    reloj = setInterval(tick, 1000);
  }

  function cuentaLinea() {
    const n = raiz.querySelectorAll(".trk-chip.on[data-acc=linea]").length;
    const el = raiz.querySelector(".trk-cuenta");
    if (el) el.textContent = `${n}/7 en cancha`;
    const empezar = raiz.querySelector("[data-acc=empezar]");
    if (empezar) empezar.disabled = n !== 7;
  }

  async function reiniciarRelojSiVacio(partidoId) {
    const quedan = await api(`track_puntos?partido_id=eq.${partidoId}&select=id&limit=1`);
    if (!quedan.length) await api(`track_partidos?id=eq.${partidoId}`, { method: "PATCH", body: JSON.stringify({ inicio_en: null }) });
  }

  async function anotarGol(puntoId, jugadorId) {
    await api("track_eventos", { method: "POST", body: JSON.stringify([
      { punto_id: puntoId, jugador_id: jugadorId, tipo: "gol" },
      { punto_id: puntoId, jugador_id: jugadorId, tipo: "pase_recibido" },
    ]) });
  }

  async function entrar() {
    const n = ++seq;
    pararReloj();
    const r = ruta();
    if (r.tipo === "lista") await vistaLista();
    else if (r.tipo === "torneo") await vistaTorneo(r);
    else await vistaPartido(r.id);
    if (n !== seq) return;
  }

  function confirmar({ titulo, texto, si, peligro, accion }) {
    document.querySelector(".trk-cancelar")?.remove();
    const m = document.createElement("div");
    m.className = "quiz-modal open trk-cancelar";
    m.innerHTML = `
      <div class="quiz-caja">
        <div class="quiz-top"><span>${esc(titulo)}</span><button class="quiz-x" type="button" data-cerrar aria-label="Cerrar">${ico("cerrar")}</button></div>
        <p class="adm-confirma">${esc(texto)}</p>
        <div class="adm-botones">
          <button type="button" class="btn ghost" data-cerrar>Volver</button>
          <button type="button" class="btn${peligro ? " peligro" : ""}" data-si>${esc(si)}</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    const alEsc = (ev) => { if (ev.key === "Escape") cerrar(); };
    const cerrar = () => { document.removeEventListener("keydown", alEsc); m.remove(); };
    document.addEventListener("keydown", alEsc);
    m.addEventListener("click", async (ev) => {
      if (ev.target === m || ev.target.closest("[data-cerrar]")) { cerrar(); return; }
      const boton = ev.target.closest("[data-si]");
      if (!boton || ocupado) return;
      boton.disabled = true;
      try {
        ocupado = true;
        await accion();
        cerrar();
      } catch (err) {
        if (err.message !== "sesión") aviso(err.message || "No se pudo.", true);
        boton.disabled = false;
      } finally {
        ocupado = false;
      }
    });
  }

  let detallePartido = null;
  let globo;
  function detalleJugador(id) {
    if (!detallePartido) return;
    const persona = detallePartido.nombres.get(id) || { nombre: "Jugador" };
    const puntos = detallePartido.puntos.filter((p) => p.resultado).sort((a, b) => a.nro - b.nro);
    const maxSeg = Math.max(20, ...puntos.map((p) => p.duracion_seg || 0));
    const notaDe = (p) => {
      const jugo = (p.track_linea || []).some((l) => l.jugador_id === id);
      const hechos = (p.track_eventos || []).filter((e) => e.jugador_id === id).sort((a, b) => a.id - b.id);
      const lado = p.lado === "ataque" ? "PA" : "PD";
      const marca = p.resultado === "favor" ? "Punto de Escándalo" : "Punto del rival";
      const tiempo = p.duracion_seg != null ? " · " + relojTxt(p.duracion_seg) : "";
      if (!jugo) return `Punto ${p.nro} · ${lado}${tiempo} · No entró.`;
      const que = hechos.length ? hechos.map((e) => NOMBRE_TIPO[e.tipo] || e.tipo).join(" · ") : "Entró y no se le cargó ninguna acción.";
      return `Punto ${p.nro} · ${lado} · ${marca}${tiempo} · ${que}`;
    };
    const barras = puntos.map((p) => {
      const jugo = (p.track_linea || []).some((l) => l.jugador_id === id);
      const hechos = (p.track_eventos || []).filter((e) => e.jugador_id === id);
      const marcas = [];
      if (hechos.some((e) => e.tipo === "gol")) marcas.push("G");
      if (hechos.some((e) => e.tipo === "asistencia")) marcas.push("A");
      if (hechos.some((e) => e.tipo === "defensa")) marcas.push("D");
      const alto = jugo ? Math.max(22, Math.round(((p.duracion_seg || 16) / maxSeg) * 128)) : 10;
      const cls = !jugo ? "fuera" : p.resultado === "favor" ? "favor" : "contra";
      return `<button type="button" class="trk-barra ${cls}" data-nota="${esc(notaDe(p))}">
        <small>${marcas.join(" ")}</small>
        <i style="height:${alto}px"></i>
        <b>${p.nro}</b>
      </button>`;
    }).join("");
    const jugados = puntos.filter((p) => (p.track_linea || []).some((l) => l.jugador_id === id)).length;
    const primero = puntos.find((p) => (p.track_linea || []).some((l) => l.jugador_id === id));
    document.querySelector(".trk-detalle")?.remove();
    const m = document.createElement("div");
    m.className = "quiz-modal open trk-detalle";
    m.innerHTML = `
      <div class="quiz-caja">
        <div class="quiz-top"><span>${esc(persona.nombre)}</span><button class="quiz-x" type="button" data-cerrar aria-label="Cerrar">${ico("cerrar")}</button></div>
        <p class="adm-confirma">${jugados} de ${puntos.length} puntos.</p>
        <div class="trk-leyenda"><span><i class="favor"></i>Escándalo</span><span><i class="contra"></i>Rival</span><span><i class="fuera"></i>No entró</span><span>G gol · A asistencia · D defensa</span></div>
        <div class="trk-grafica">${barras || `<p class="adm-confirma">Todavía no hay puntos cerrados.</p>`}</div>
        <p class="trk-nota">${primero ? esc(notaDe(primero)) : "No jugó ningún punto cerrado."}</p>
        <div class="adm-botones"><button type="button" class="btn ghost" data-cerrar>Cerrar</button></div>
      </div>`;
    document.body.appendChild(m);
    const alEsc = (ev) => { if (ev.key === "Escape") cerrar(); };
    const cerrar = () => { document.removeEventListener("keydown", alEsc); m.remove(); };
    document.addEventListener("keydown", alEsc);
    if (primero) m.querySelector(".trk-barra:not(.fuera)")?.classList.add("on");
    m.addEventListener("click", (ev) => {
      const barra = ev.target.closest(".trk-barra");
      if (barra) {
        m.querySelectorAll(".trk-barra.on").forEach((x) => x.classList.remove("on"));
        barra.classList.add("on");
        const nota = m.querySelector(".trk-nota");
        if (nota) nota.textContent = barra.dataset.nota;
        return;
      }
      if (ev.target === m || ev.target.closest("[data-cerrar]")) cerrar();
    });
  }

  function mostrarGlobo(el) {
    if (!el?.dataset.info) return;
    if (!globo) {
      globo = document.createElement("div");
      globo.className = "trk-globo";
      globo.hidden = true;
      document.body.appendChild(globo);
    }
    globo.textContent = el.dataset.info;
    globo.hidden = false;
    const r = el.getBoundingClientRect();
    const ancho = globo.offsetWidth;
    const alto = globo.offsetHeight;
    globo.style.left = Math.max(8, Math.min(r.left, window.innerWidth - ancho - 8)) + "px";
    globo.style.top = Math.max(8, r.top - alto - 8) + "px";
  }
  const ocultarGlobo = () => { if (globo) globo.hidden = true; };

  raiz.addEventListener("click", async (e) => {
    const avisoTip = e.target.closest(".trk-tip");
    raiz.querySelectorAll(".trk-tip.tip").forEach((el) => { if (el !== avisoTip) el.classList.remove("tip"); });
    if (avisoTip) {
      avisoTip.classList.toggle("tip");
      if (avisoTip.classList.contains("tip")) mostrarGlobo(avisoTip);
      else ocultarGlobo();
    } else ocultarGlobo();
    const b = e.target.closest("[data-acc]");
    if (!b || b.disabled || ocupado) return;
    const acc = b.dataset.acc;
    if (acc === "jugador") { detalleJugador(+b.dataset.jugador); return; }
    if (acc === "lado") {
      raiz.querySelectorAll(".trk-lado").forEach((x) => x.classList.toggle("on", x === b));
      return;
    }
    if (acc === "linea") {
      if (!b.classList.contains("on") && raiz.querySelectorAll(".trk-chip.on[data-acc=linea]").length >= 7) {
        aviso("En la cancha entran 7.", true);
        return;
      }
      b.classList.toggle("on");
      cuentaLinea();
      return;
    }
    if (acc === "modo") {
      const estaba = cambio;
      cambio = null;
      esperando = null;
      modo = b.dataset.tipo;
      if (estaba) { await entrar(); return; }
      raiz.querySelectorAll("[data-acc=modo]").forEach((x) => x.classList.toggle("on", x === b));
      const ayuda = raiz.querySelector(".trk-ayuda");
      if (ayuda) ayuda.textContent = "Elegí la acción y tocá a quién. La acción queda elegida para el siguiente toque.";
      raiz.querySelectorAll(".trk-chip").forEach((x) => {
        x.dataset.acc = "anotar";
        x.classList.remove("trk-lanzo");
        x.classList.add("on");
      });
      raiz.querySelector(".trk-acciones")?.classList.remove("trk-espera");
      return;
    }
    try {
      ocupado = true;
      if (acc === "form-torneo") { formTorneo = !formTorneo; await entrar(); }
      else if (acc === "form-jugador") { formJugador = !formJugador; await entrar(); }
      else if (acc === "juega") {
        const torneo = ruta().id;
        await api(`track_roster?torneo_id=eq.${torneo}&jugador_id=eq.${b.dataset.jugador}`, {
          method: "PATCH", body: JSON.stringify({ juega: b.dataset.juega !== "1" }),
        });
        await entrar();
      } else if (acc === "sumar") {
        await api("track_roster", { method: "POST", body: JSON.stringify({ torneo_id: ruta().id, jugador_id: +b.dataset.jugador, juega: true }) });
        await entrar();
      } else if (acc === "borrar-torneo") {
        const id = +b.dataset.torneo;
        confirmar({
          titulo: "Borrar torneo",
          texto: "Se borra el torneo y todos sus partidos. No queda ningún registro.",
          si: "Borrar torneo",
          peligro: true,
          accion: async () => {
            const invitados = await api(`track_roster?torneo_id=eq.${id}&select=jugador_id,jugadores!inner(invitado)&jugadores.invitado=eq.true`);
            for (const v of invitados) {
              const otros = await api(`track_roster?jugador_id=eq.${v.jugador_id}&torneo_id=neq.${id}&select=torneo_id&limit=1`);
              if (!otros.length) await api(`jugadores?id=eq.${v.jugador_id}`, { method: "DELETE" });
            }
            await api(`track_torneos?id=eq.${id}`, { method: "DELETE" });
            location.hash = "";
          },
        });
      } else if (acc === "empezar") {
        const lado = raiz.querySelector(".trk-lado.on")?.dataset.lado;
        const ids = [...raiz.querySelectorAll(".trk-chip.on[data-acc=linea]")].map((x) => +x.dataset.jugador);
        if (!lado) { aviso("Elegí ataque o defensa.", true); return; }
        if (ids.length !== 7) { aviso("Tienen que ser 7 en cancha.", true); return; }
        const partido = ruta().id;
        const ya = await api(`track_puntos?partido_id=eq.${partido}&select=nro&order=nro.desc&limit=1`);
        const creado = await api("track_puntos", { method: "POST", body: JSON.stringify({ partido_id: partido, nro: (ya[0]?.nro || 0) + 1, lado }) });
        try {
          await api("track_linea", { method: "POST", body: JSON.stringify(ids.map((jugador_id) => ({ punto_id: creado[0].id, jugador_id }))) });
          if (!ya.length) await api(`track_partidos?id=eq.${partido}`, { method: "PATCH", body: JSON.stringify({ inicio_en: new Date().toISOString() }) });
        } catch (err) {
          await api(`track_puntos?id=eq.${creado[0].id}`, { method: "DELETE" });
          throw err;
        }
        await entrar();
      } else if (acc === "cambio") {
        esperando = null;
        cambio = { puntoId: +b.dataset.punto, sale: null };
        await entrar();
      } else if (acc === "cancelar-cambio") {
        cambio = null;
        await entrar();
      } else if (acc === "sale") {
        if (!cambio) return;
        cambio = { puntoId: cambio.puntoId, sale: +b.dataset.jugador };
        await entrar();
      } else if (acc === "entra") {
        if (!cambio?.sale) return;
        const puntoId = cambio.puntoId;
        const sale = cambio.sale;
        const entra = +b.dataset.jugador;
        await api(`track_linea?punto_id=eq.${puntoId}&jugador_id=eq.${sale}`, { method: "DELETE" });
        try {
          await api("track_linea", { method: "POST", body: JSON.stringify({ punto_id: puntoId, jugador_id: entra }) });
        } catch (err) {
          await api("track_linea", { method: "POST", body: JSON.stringify({ punto_id: puntoId, jugador_id: sale }) });
          throw err;
        }
        if (esperando && esperando.ya === sale) esperando = null;
        cambio = null;
        await entrar();
      } else if (acc === "anotar") {
        if (!modo) { aviso("Elegí la acción.", true); return; }
        const abierto = raiz.querySelector("[data-acc=deshacer]");
        const puntoId = +abierto.dataset.punto;
        const jugadorId = +b.dataset.jugador;
        if (modo === "gol") await anotarGol(puntoId, jugadorId);
        else await api("track_eventos", { method: "POST", body: JSON.stringify({ punto_id: puntoId, jugador_id: jugadorId, tipo: modo }) });
        const paso = modo === "pase_completado" ? "pase" : modo === "gol" ? "gol" : modo === "asistencia" ? "asistencia" : null;
        esperando = paso ? { puntoId, ya: jugadorId, paso } : null;
        await entrar();
      } else if (acc === "lanzador") {
        if (cambio?.sale) return;
        const texto = esperando?.paso === "gol"
          ? "Elegí a quien se lo pasó, no a quien hizo el gol."
          : esperando?.paso === "asistencia"
            ? "Elegí a quien hizo el gol, no a quien asistió."
            : "Elegí a un compañero, no a quien tiró.";
        aviso(texto, true);
      } else if (acc === "recibir") {
        const abierto = raiz.querySelector("[data-acc=deshacer]");
        const puntoId = +abierto.dataset.punto;
        const paso = esperando?.paso;
        const jugadorId = +b.dataset.jugador;
        const inicio = raiz.querySelector(".trk-cron")?.dataset.inicio;
        if (paso === "punto-gol") {
          await anotarGol(puntoId, jugadorId);
          esperando = { puntoId, ya: jugadorId, paso: "punto-asistencia" };
          await entrar();
          return;
        }
        if (paso === "punto-asistencia") {
          await api("track_eventos", { method: "POST", body: JSON.stringify({ punto_id: puntoId, jugador_id: jugadorId, tipo: "asistencia" }) });
          const seg = Math.max(0, Math.round((Date.now() - new Date(inicio).getTime()) / 1000));
          esperando = null;
          await api(`track_puntos?id=eq.${puntoId}`, {
            method: "PATCH",
            body: JSON.stringify({ resultado: "favor", duracion_seg: seg, cerrado_en: new Date().toISOString() }),
          });
          await entrar();
          return;
        }
        const tipo = paso === "gol" ? "asistencia" : paso === "asistencia" ? "gol" : "pase_recibido";
        if (tipo === "gol") await anotarGol(puntoId, +b.dataset.jugador);
        else await api("track_eventos", { method: "POST", body: JSON.stringify({ punto_id: puntoId, jugador_id: +b.dataset.jugador, tipo }) });
        esperando = null;
        if (paso === "gol" || paso === "asistencia") {
          const seg = Math.max(0, Math.round((Date.now() - new Date(inicio).getTime()) / 1000));
          await api(`track_puntos?id=eq.${puntoId}`, {
            method: "PATCH",
            body: JSON.stringify({ resultado: "favor", duracion_seg: seg, cerrado_en: new Date().toISOString() }),
          });
        } else modo = "pase_completado";
        await entrar();
      } else if (acc === "deshacer") {
        const puntoId = +b.dataset.punto;
        const evs = await api(`track_eventos?punto_id=eq.${puntoId}&select=id,tipo,jugador_id&order=id.desc&limit=2`);
        const golDelPunto = esperando?.paso === "punto-asistencia" && esperando.puntoId === puntoId
          && evs.length >= 2 && evs[0].jugador_id === evs[1].jugador_id
          && evs[0].tipo === "pase_recibido" && evs[1].tipo === "gol";
        const golConRecibido = esperando?.paso === "gol" && esperando.puntoId === puntoId
          && evs.length === 2 && evs[0].jugador_id === evs[1].jugador_id
          && evs.some((e) => e.tipo === "gol") && evs.some((e) => e.tipo === "pase_recibido");
        if (golDelPunto) {
          esperando = { puntoId, paso: "punto-gol" };
          await api(`track_eventos?id=in.(${evs.slice(0, 2).map((e) => e.id).join(",")})`, { method: "DELETE" });
        } else if (golConRecibido) {
          esperando = null;
          await api(`track_eventos?id=in.(${evs.map((e) => e.id).join(",")})`, { method: "DELETE" });
        } else {
          const eligiendoGol = esperando?.paso === "punto-gol" && esperando.puntoId === puntoId;
          if (!eligiendoGol && esperando && esperando.puntoId === puntoId) esperando = null;
          else if (!eligiendoGol && evs[0]?.tipo === "pase_recibido" && evs[1]?.tipo === "pase_completado") esperando = { puntoId, ya: evs[1].jugador_id, paso: "pase" };
          if (evs[0]) await api(`track_eventos?id=eq.${evs[0].id}`, { method: "DELETE" });
        }
        await entrar();
      } else if (acc === "cerrar") {
        const puntoId = +b.dataset.punto;
        if (esperando?.paso === "punto-gol" || esperando?.paso === "punto-asistencia") {
          aviso(esperando.paso === "punto-gol" ? "Elegí quién hizo el gol." : "Elegí quién dio la asistencia.", true);
          return;
        }
        if (esperando) {
          const falta = esperando.paso === "gol" ? "Elegí quién se lo pasó." : esperando.paso === "asistencia" ? "Elegí quién hizo el gol." : "Elegí a quién le llegó el pase.";
          aviso(falta, true);
          return;
        }
        if (b.dataset.resultado === "favor") {
          cambio = null;
          esperando = { puntoId, paso: "punto-gol" };
          await entrar();
          return;
        }
        const seg = Math.max(0, Math.round((Date.now() - new Date(b.dataset.inicio).getTime()) / 1000));
        await api(`track_puntos?id=eq.${b.dataset.punto}`, {
          method: "PATCH",
          body: JSON.stringify({ resultado: b.dataset.resultado, duracion_seg: seg, cerrado_en: new Date().toISOString() }),
        });
        await entrar();
      } else if (acc === "cancelar") {
        const puntoId = +b.dataset.punto;
        confirmar({
          titulo: "Cancelar punto",
          texto: "Si lo cancelás, este punto no queda en el partido. No se guardan ni el tiempo ni las acciones.",
          si: "Cancelar punto",
          peligro: true,
          accion: async () => {
            if (esperando && esperando.puntoId === puntoId) esperando = null;
            await api(`track_puntos?id=eq.${puntoId}`, { method: "DELETE" });
            await reiniciarRelojSiVacio(ruta().id);
            await entrar();
          },
        });
      } else if (acc === "borrar-punto") {
        const puntoId = +b.dataset.punto;
        confirmar({
          titulo: "Borrar último punto",
          texto: "Se borra el último punto y no queda en el partido.",
          si: "Borrar punto",
          peligro: true,
          accion: async () => {
            await api(`track_puntos?id=eq.${puntoId}`, { method: "DELETE" });
            await reiniciarRelojSiVacio(ruta().id);
            await entrar();
          },
        });
      } else if (acc === "reabrir") {
        seguirTrackeo = +b.dataset.partido;
        await api(`track_partidos?id=eq.${b.dataset.partido}`, { method: "PATCH", body: JSON.stringify({ estado: "abierto", finalizado_en: null, cierre: null }) });
        await entrar();
      } else if (acc === "medio") {
        if (raiz.querySelector("[data-acc=cerrar]")) { aviso("Cerrá el punto en juego antes del medio tiempo.", true); return; }
        await api(`track_partidos?id=eq.${b.dataset.partido}`, { method: "PATCH", body: JSON.stringify({ medio_en: new Date().toISOString(), medio_motivo: "manual" }) });
        await entrar();
      } else if (acc === "descanso") {
        const min = +b.dataset.min;
        if (![4, 5, 6, 8, 10].includes(min)) return;
        await api(`track_partidos?id=eq.${b.dataset.partido}`, { method: "PATCH", body: JSON.stringify({ descanso_seg: min * 60, descanso_inicio: new Date().toISOString() }) });
        await entrar();
      } else if (acc === "seguir") {
        await api(`track_partidos?id=eq.${b.dataset.partido}`, { method: "PATCH", body: JSON.stringify({ reanudado_en: new Date().toISOString() }) });
        await entrar();
      } else if (acc === "finalizar") {
        if (raiz.querySelector("[data-acc=cerrar]")) { aviso("Cerrá el punto en juego antes de finalizar.", true); return; }
        const partidoId = +b.dataset.partido;
        confirmar({
          titulo: "Finalizar partido",
          texto: "El partido queda cerrado. Después podés seguir trackeando si faltó algo.",
          si: "Finalizar",
          accion: async () => {
            await api(`track_partidos?id=eq.${partidoId}`, { method: "PATCH", body: JSON.stringify({ estado: "finalizado", finalizado_en: new Date().toISOString(), cierre: "manual" }) });
            await entrar();
          },
        });
      } else if (acc === "borrar-partido") {
        const partidoId = +b.dataset.partido;
        const torneoId = b.dataset.torneo;
        confirmar({
          titulo: "Borrar partido",
          texto: "Se borra este partido y todos sus puntos. No queda ningún registro.",
          si: "Borrar partido",
          peligro: true,
          accion: async () => {
            await api(`track_partidos?id=eq.${partidoId}`, { method: "DELETE" });
            location.hash = `t-${torneoId}-partidos`;
          },
        });
      }
    } catch (err) {
      if (err.message !== "sesión") aviso(err.message || "No se pudo guardar.", true);
    } finally {
      ocupado = false;
    }
  });

  raiz.addEventListener("mouseover", (e) => {
    const el = e.target.closest(".trk-tip");
    if (el) mostrarGlobo(el);
  });
  raiz.addEventListener("mouseout", (e) => {
    const el = e.target.closest(".trk-tip");
    if (el && !el.classList.contains("tip")) ocultarGlobo();
  });

  raiz.addEventListener("change", (e) => {
    if (e.target.name !== "unico") return;
    const form = e.target.closest("form");
    const extra = form.querySelector(".trk-unico");
    const on = e.target.checked;
    extra.hidden = !on;
    form.querySelector("[name=nombre]").required = !on;
    form.querySelector("[name=rival]").required = on;
    form.querySelector("[name=duracion_min]").required = on;
    form.querySelector("[type=submit]").textContent = on ? "Crear partido" : "Crear torneo";
  });

  raiz.addEventListener("submit", async (e) => {
    const form = e.target.closest("form");
    if (!form) return;
    e.preventDefault();
    if (ocupado) return;
    const d = new FormData(form);
    try {
      ocupado = true;
      if (form.dataset.form === "torneo") {
        const unico = d.get("unico") === "on";
        const rival = String(d.get("rival") || "").trim();
        const minutos = Math.round(Number(d.get("duracion_min")));
        let nombre = String(d.get("nombre") || "").trim();
        if (unico) {
          if (!rival) { aviso("Poné el rival.", true); return; }
          if (!Number.isInteger(minutos) || minutos < 10 || minutos > 180) { aviso("El tiempo tiene que ser entre 10 y 180 minutos.", true); return; }
          if (!nombre) nombre = rival;
        } else if (!nombre) { aviso("Poné el nombre del torneo.", true); return; }
        const creado = await api("track_torneos", { method: "POST", body: JSON.stringify({
          nombre, lugar: String(d.get("lugar") || "").trim() || null, desde: d.get("desde") || null,
        }) });
        const plantel = await api("jugadores?activo=eq.true&select=id");
        if (plantel.length) {
          await api("track_roster", { method: "POST", body: JSON.stringify(plantel.map((j) => ({ torneo_id: creado[0].id, jugador_id: j.id, juega: true }))) });
        }
        formTorneo = false;
        if (unico) {
          const partido = await api("track_partidos", { method: "POST", body: JSON.stringify({ torneo_id: creado[0].id, rival, fase: "Amistoso", duracion_min: minutos }) });
          location.hash = `p-${partido[0].id}`;
        } else location.hash = `t-${creado[0].id}-roster`;
      } else if (form.dataset.form === "partido") {
        const rival = String(d.get("rival") || "").trim();
        const minutos = Math.round(Number(d.get("duracion_min")));
        if (!rival) { aviso("Poné el rival.", true); return; }
        if (!Number.isInteger(minutos) || minutos < 10 || minutos > 180) { aviso("El tiempo tiene que ser entre 10 y 180 minutos.", true); return; }
        const creado = await api("track_partidos", { method: "POST", body: JSON.stringify({ torneo_id: +form.dataset.torneo, rival, fase: d.get("fase") || "Grupos", duracion_min: minutos }) });
        location.hash = `p-${creado[0].id}`;
      } else if (form.dataset.form === "jugador") {
        const nombre = String(d.get("nombre") || "").trim();
        if (!nombre) { aviso("Poné el nombre.", true); return; }
        const base = slugDe(nombre) || "jugador";
        let slug = base;
        for (let i = 0; i < 6; i++) {
          const prueba = i ? `${base}-${i + 1}` : base;
          const ya = await api(`jugadores?slug=eq.${encodeURIComponent(prueba)}&select=id`);
          if (!ya.length) { slug = prueba; break; }
          if (i === 5) throw new Error("Ya hay un jugador con ese nombre.");
        }
        const apodo = String(d.get("apodo") || "").trim() || nombre.split(" ")[0];
        const creado = await api("jugadores", { method: "POST", body: JSON.stringify({
          slug, nombre, apodo, foto: `${slug}.webp`, nacionalidad: "Uruguaya", dato: "", activo: false, invitado: true, rol: "jugador",
        }) });
        await api("track_roster", { method: "POST", body: JSON.stringify({ torneo_id: +form.dataset.torneo, jugador_id: creado[0].id, juega: true }) });
        formJugador = false;
        aviso("Quedó en este torneo.");
        await entrar();
      }
    } catch (err) {
      if (err.message !== "sesión") aviso(err.message || "No se pudo guardar.", true);
    } finally {
      ocupado = false;
    }
  });

  addEventListener("hashchange", () => { entrar().catch((err) => { if (err.message !== "sesión") aviso(err.message || "No se pudo cargar.", true); }); });

  (async () => {
    if (typeof SUPABASE === "undefined" || !SUPABASE) {
      raiz.innerHTML = `<p class="adm-vacio">El trackeo todavía no está disponible en el sitio publicado.</p>`;
      return;
    }
    if (!(await Sesion.token())) { location.href = "/login"; return; }
    if ((await Sesion.rol()) !== "admin") {
      raiz.innerHTML = `<div class="adm-vacio"><h1>Sin acceso</h1><p>Esta sección es solo para administradores.</p><a class="btn" href="/">Volver al inicio</a></div>`;
      return;
    }
    try { await entrar(); }
    catch (err) { if (err.message !== "sesión") raiz.innerHTML = `<p class="adm-vacio">${esc(err.message || "No se pudo cargar")}</p>`; }
  })();
})();
