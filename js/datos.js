// Carga los datos desde la base (si hay una configurada) y recién después arranca el resto de los scripts.
// Si la base no responde, usa la última copia guardada en el navegador, y si no hay, los datos de js/data.js.
// Cada página lista los scripts que van después en data-despues="a.js,b.js,...".
(() => {
  const yo = document.currentScript;
  const despues = (yo.dataset.despues || "").split(",").filter(Boolean);
  const base = yo.getAttribute("src").replace(/[^/]*$/, "");       // "js/" o "/js/"
  const CLAVE_CACHE = "escandalo-datos-v1";

  const pedir = async (ruta) => {
    const r = await fetch(`${SUPABASE.url}/rest/v1/${ruta}`, {
      headers: { apikey: SUPABASE.key, Authorization: `Bearer ${SUPABASE.key}` },
      signal: AbortSignal.timeout(2500),
    });
    if (!r.ok) throw new Error(`${ruta}: HTTP ${r.status}`);
    return r.json();
  };

  // Traduce las filas de la base al formato que usa el sitio
  const traducir = ({ torneos, jugadores, partidos }) => {
    const baseNombre = (t) => t.nombre.split(" · ")[0];
    const porId = Object.fromEntries(torneos.map((t) => [t.id, t]));
    return {
      TORNEOS: torneos.map((t) => ({ id: t.id, nombre: t.nombre, desde: t.desde, hasta: t.hasta, lugar: t.lugar,
        ...(t.logro && { logro: t.logro }), ...(t.hito && { hito: t.hito }) })),
      JUGADORES: jugadores.map((j) => ({ nombre: j.nombre, apodo: j.apodo, foto: j.foto,
        ...(j.numero != null && { numero: j.numero }), ...(j.nacionalidad && { nacionalidad: j.nacionalidad }), ...(j.dato && { dato: j.dato }) })),
      RESULTADOS: partidos.filter((p) => porId[p.torneo_id]).map((p) => ({ fecha: p.fecha, rival: p.rival, nuestros: p.nuestros, suyos: p.suyos,
        torneo: baseNombre(porId[p.torneo_id]) + (p.fase ? ` · ${p.fase}` : "") })),
    };
  };

  // Reemplaza el contenido de los arreglos de data.js (son const, pero se pueden modificar por dentro)
  const aplicar = (d) => {
    for (const [nombre, lista] of Object.entries({ TORNEOS, JUGADORES, RESULTADOS })) {
      if (Array.isArray(d[nombre]) && d[nombre].length) { lista.length = 0; lista.push(...d[nombre]); }
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
        const [torneos, jugadores, partidos] = await Promise.all([
          pedir("torneos?select=*&order=desde.asc"),
          pedir("jugadores?select=*&activo=eq.true&order=nombre.asc"),
          pedir("partidos?select=*&order=fecha.asc,id.asc"),
        ]);
        const datos = traducir({ torneos, jugadores, partidos });
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
