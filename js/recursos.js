// Recursos del equipo: planes y ejercicios. Solo administradores. Los PDF viven en un bucket privado.
(() => {
  const raiz = document.querySelector("#recursos-equipo");
  if (!raiz) return;

  const GRUPOS = [
    ["planes", "Planes de semana", "El plan de cada semana"],
    ["practicas", "Prácticas", "Ejercicios de cada práctica"],
  ];
  const ARCHIVOS = [
    { grupo: "planes", titulo: "Semana 3", archivo: "semana-03.pdf" },
    { grupo: "planes", titulo: "Semana 4", archivo: "semana-04.pdf" },
    { grupo: "planes", titulo: "Semana 5", archivo: "semana-05.pdf" },
    { grupo: "planes", titulo: "Semana 6", archivo: "semana-06.pdf" },
    { grupo: "planes", titulo: "Semana 7", archivo: "semana-07.pdf" },
    { grupo: "planes", titulo: "Semana 8", archivo: "semana-08.pdf" },
    { grupo: "planes", titulo: "Semana 9", archivo: "semana-09.pdf" },
    { grupo: "planes", titulo: "Semana 10", archivo: "semana-10.pdf" },
    { grupo: "planes", titulo: "Semana 11", archivo: "semana-11.pdf" },
    { grupo: "planes", titulo: "Semana 12", archivo: "semana-12.pdf" },
    { grupo: "planes", titulo: "Scrimmage Focus 2024", archivo: "scrimmage-focus-2024.pdf" },
    { grupo: "practicas", titulo: "Semana 1 · práctica 1", archivo: "semana-01-practica-1.pdf" },
    { grupo: "practicas", titulo: "Semana 1 · práctica 2", archivo: "semana-01-practica-2.pdf" },
    { grupo: "practicas", titulo: "Semana 2 · práctica 1", archivo: "semana-02-practica-1.pdf" },
    { grupo: "practicas", titulo: "Semana 2 · práctica 2", archivo: "semana-02-practica-2.pdf" },
    { grupo: "practicas", titulo: "Semana 3 · práctica 1", archivo: "semana-03-practica-1.pdf" },
    { grupo: "practicas", titulo: "Semana 3 · práctica 2", archivo: "semana-03-practica-2.pdf" },
    { grupo: "practicas", titulo: "Semana 4 · práctica 2", archivo: "semana-04-practica-2.pdf" },
    { grupo: "practicas", titulo: "Semana 5 · práctica 1", archivo: "semana-05-practica-1.pdf" },
    { grupo: "practicas", titulo: "Semana 5 · práctica 2", archivo: "semana-05-practica-2.pdf" },
    { grupo: "practicas", titulo: "Semana 6 · práctica 1", archivo: "semana-06-practica-1.pdf" },
    { grupo: "practicas", titulo: "Semana 6 · práctica 2", archivo: "semana-06-practica-2.pdf" },
    { grupo: "practicas", titulo: "Semana 7 · práctica 1", archivo: "semana-07-practica-1.pdf" },
    { grupo: "practicas", titulo: "Semana 7 · práctica 2", archivo: "semana-07-practica-2.pdf" },
    { grupo: "practicas", titulo: "Semana 8 · práctica 1", archivo: "semana-08-practica-1.pdf" },
    { grupo: "practicas", titulo: "Semana 8 · práctica 2", archivo: "semana-08-practica-2.pdf" },
    { grupo: "practicas", titulo: "Semana 9 · práctica 1", archivo: "semana-09-practica-1.pdf" },
    { grupo: "practicas", titulo: "Semana 9 · práctica 2", archivo: "semana-09-practica-2.pdf" },
  ];

  const burger = document.querySelector("#burger"), menu = document.querySelector("#menu");
  if (burger && menu) {
    burger.onclick = () => menu.classList.toggle("open");
    menu.addEventListener("click", () => menu.classList.remove("open"));
  }

  function pintar() {
    raiz.innerHTML = `
      <div class="adm-cab">
        <div><h1>Recursos</h1><p>Planes de práctica y ejercicios. Se abren en otra pestaña o se descargan.</p></div>
      </div>
      ${GRUPOS.map(([g, titulo, sub]) => `
        <h2 class="grupo-ult">${titulo} <small>${sub}</small></h2>
        <div class="rec-lista">
          ${ARCHIVOS.filter((a) => a.grupo === g).map((a) => `
            <article class="rec-item">
              <h3>${escHtml(a.titulo)}</h3>
              <div class="recurso-acciones">
                <button class="btn" type="button" data-ver="${escHtml(a.archivo)}">Ver</button>
                <button class="btn ghost" type="button" data-bajar="${escHtml(a.archivo)}" data-nombre="${escHtml(a.titulo)}">Descargar</button>
              </div>
            </article>`).join("")}
        </div>`).join("")}`;
  }

  async function traer(archivo) {
    const t = await Sesion.token();
    if (!t) { location.href = "/login"; return null; }
    const r = await fetch(`${SUPABASE.url}/storage/v1/object/authenticated/recursos/${archivo}`, {
      headers: { apikey: SUPABASE.key, Authorization: `Bearer ${t}` },
    });
    if (r.status === 401 || r.status === 403) { location.href = "/login"; return null; }
    if (!r.ok) throw new Error("no se pudo bajar");
    const buf = await r.arrayBuffer();
    return new Blob([buf], { type: "application/pdf" });
  }

  function ocupado(btn, texto) {
    btn.disabled = true;
    const antes = btn.textContent;
    btn.textContent = texto;
    return () => { btn.disabled = false; btn.textContent = antes; };
  }

  raiz.addEventListener("click", async (e) => {
    const ver = e.target.closest("[data-ver]");
    const bajar = e.target.closest("[data-bajar]");
    const btn = ver || bajar;
    if (!btn || btn.disabled) return;
    const archivo = ver ? ver.dataset.ver : bajar.dataset.bajar;
    const ventana = ver ? window.open("", "_blank") : null;
    const listo = ocupado(btn, "Abriendo…");
    try {
      const blob = await traer(archivo);
      if (!blob) { if (ventana) ventana.close(); return; }
      const url = URL.createObjectURL(blob);
      if (ver) {
        if (ventana) ventana.location = url;
        else location.href = url;
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = (bajar.dataset.nombre || "recurso").replace(/[^\wáéíóúñü .()-]+/gi, "") + ".pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      if (ventana) ventana.close();
      btn.textContent = "No se pudo";
      setTimeout(listo, 1600);
      return;
    }
    listo();
  });

  (async () => {
    if (typeof SUPABASE === "undefined" || !SUPABASE) {
      raiz.innerHTML = `<p class="adm-vacio">Los recursos todavía no están disponibles en el sitio publicado.</p>`;
      return;
    }
    if (!(await Sesion.token())) { location.href = "/login"; return; }
    if ((await Sesion.rol()) !== "admin") {
      raiz.innerHTML = `<div class="adm-vacio"><h1>Sin acceso</h1><p>Esta sección es solo para administradores.</p><a class="btn" href="/">Volver al inicio</a></div>`;
      return;
    }
    pintar();
  })();
})();
