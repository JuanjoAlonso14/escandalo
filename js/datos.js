// Carga los datos desde la base (si hay una configurada) y recién después arranca el resto de los scripts.
// Si la base no responde, usa la última copia guardada en el navegador, y si no hay, los datos de js/data.js.
// Cada página lista los scripts que van después en data-despues="a.js,b.js,...".
(() => {
  const yo = document.currentScript;
  const despues = (yo.dataset.despues || "").split(",").filter(Boolean);
  const base = yo.getAttribute("src").replace(/[^/]*$/, "");       // "js/" o "/js/"
  const CLAVE_CACHE = "escandalo-datos-v2";

  const pedir = async (ruta) => {
    const r = await fetch(`${SUPABASE.url}/rest/v1/${ruta}`, {
      headers: { apikey: SUPABASE.key, Authorization: `Bearer ${SUPABASE.key}` },
      signal: AbortSignal.timeout(SUPABASE.espera || 2500),
    });
    if (!r.ok) throw new Error(`${ruta}: HTTP ${r.status}`);
    return r.json();
  };

  // timestamp de la base ("2026-12-04T00:00:00") → formato que usa el sitio ("2026-12-04 00:00")
  const fechaPartido = (s) => {
    const m = String(s).match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
    return m ? `${m[1]} ${m[2]}` : s;
  };

  // Traduce las filas de la base al formato que usa el sitio
  const traducir = ({ torneos, jugadores, partidos, equipo, entrenamientos, proximos, historia, hitos }) => {
    const baseNombre = (t) => t.nombre.split(" · ")[0];
    const porId = Object.fromEntries(torneos.map((t) => [t.id, t]));
    const e = equipo[0];
    return {
      TORNEOS: torneos.map((t) => ({ id: t.id, nombre: t.nombre, desde: t.desde, hasta: t.hasta, lugar: t.lugar,
        ...(t.logro && { logro: t.logro }), ...(t.hito && { hito: t.hito }) })),
      JUGADORES: jugadores.map((j) => ({ id: j.id, slug: j.slug, nombre: j.nombre, apodo: j.apodo, foto: j.foto,
        ...(j.numero != null && { numero: j.numero }), ...(j.nacionalidad && { nacionalidad: j.nacionalidad }), ...(j.dato && { dato: j.dato }) })),
      RESULTADOS: partidos.filter((p) => porId[p.torneo_id]).map((p) => ({ fecha: p.fecha, rival: p.rival, nuestros: p.nuestros, suyos: p.suyos,
        torneo: baseNombre(porId[p.torneo_id]) + (p.fase ? ` · ${p.fase}` : "") })),
      ...(e && {
        TEAM: {
          nombre: e.nombre, whatsapp: e.whatsapp, email: e.email, instagram: e.instagram,
          entrenamientos: entrenamientos.map((x) => ({ dia: x.dia, hora: x.hora, lugar: x.lugar, ...(x.mapa && { mapa: x.mapa }) })),
        },
      }),
      PARTIDOS: proximos.map((p) => ({ fecha: fechaPartido(p.fecha), torneo: p.torneo, lugar: p.lugar,
        ...(p.rival && { rival: p.rival }), ...(p.fechas && { fechas: p.fechas }) })),
      HISTORIA: historia.map((h) => h.texto),
      HITOS: hitos.map((h) => ({ fecha: h.fecha, icono: h.icono, titulo: h.titulo, texto: h.texto })),
    };
  };

  // Reemplaza el contenido de las constantes de data.js (son const, pero se pueden modificar por dentro)
  const aplicar = (d) => {
    for (const [nombre, lista] of Object.entries({ TORNEOS, JUGADORES, RESULTADOS, PARTIDOS, HISTORIA, HITOS })) {
      if (Array.isArray(d[nombre]) && d[nombre].length) { lista.length = 0; lista.push(...d[nombre]); }
    }
    if (d.TEAM && typeof TEAM !== "undefined") {
      Object.assign(TEAM, { nombre: d.TEAM.nombre, whatsapp: d.TEAM.whatsapp, email: d.TEAM.email, instagram: d.TEAM.instagram });
      if (Array.isArray(d.TEAM.entrenamientos) && d.TEAM.entrenamientos.length) {
        TEAM.entrenamientos.length = 0;
        TEAM.entrenamientos.push(...d.TEAM.entrenamientos);
      }
    }
  };

  const cargarScripts = () => despues.reduce((p, nombre) => p.then(() => new Promise((ok) => {
    const s = document.createElement("script");
    s.src = base + nombre; s.async = false;
    s.onload = s.onerror = ok;
    document.body.appendChild(s);
  })), Promise.resolve());

  (async () => {
    let origen = "data.js";
    if (typeof SUPABASE !== "undefined" && SUPABASE) {
      try {
        const [torneos, jugadores, partidos, equipo, entrenamientos, proximos, historia, hitos] = await Promise.all([
          pedir("torneos?select=*&order=desde.asc"),
          pedir("jugadores?select=id,slug,nombre,apodo,foto,numero,nacionalidad,dato,activo&activo=eq.true&order=nombre.asc"),
          pedir("partidos?select=*&order=fecha.asc,id.asc"),
          pedir("equipo?select=*&id=eq.1"),
          pedir("entrenamientos?select=*&order=orden.asc,id.asc"),
          pedir("proximos?select=*&order=fecha.asc,id.asc"),
          pedir("historia?select=*&order=orden.asc"),
          pedir("hitos?select=*&order=fecha.asc,id.asc"),
        ]);
        const datos = traducir({ torneos, jugadores, partidos, equipo, entrenamientos, proximos, historia, hitos });
        aplicar(datos); origen = "base";
        try { localStorage.setItem(CLAVE_CACHE, JSON.stringify(datos)); } catch (e) {}
      } catch (e) {
        try {
          const guardado = JSON.parse(localStorage.getItem(CLAVE_CACHE) || "null");
          if (guardado) { aplicar(guardado); origen = "copia guardada"; }
        } catch (e2) {}
        console.warn("No se pudo leer la base; se usan datos de respaldo.", e.message);
      }
    }
    window.ORIGEN_DATOS = origen;
    cargarScripts();
  })();
})();
