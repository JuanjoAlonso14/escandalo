const $ = (s) => document.querySelector(s);
$("#year").textContent = new Date().getFullYear();
$("#ig").href = TEAM.instagram;
$("#mail").href = "mailto:" + TEAM.email;
$("#burger").onclick = () => $("#menu").classList.toggle("open");
$("#menu").addEventListener("click", () => $("#menu").classList.remove("open"));

if ($("#historia-texto")) $("#historia-texto").innerHTML = HISTORIA.map((p) => `<p>${conIconos(p)}</p>`).join("");

// Línea de tiempo: hitos propios + torneos (con su resultado si ya se jugaron)
const lineaEl = $("#linea");
if (lineaEl) {
  const MC = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  const ganoR = (r) => r.resultado ? r.resultado === "V" : r.nuestros > r.suyos;
  const items = [
    ...HITOS,
    ...TORNEOS.map((t) => {
      const base = t.nombre.split(" · ")[0];
      const ps = RESULTADOS.filter((r) => r.torneo.split(" · ")[0] === base);
      const futuro = new Date(t.hasta + "T00:00").getTime() + 864e5 > Date.now();
      const v = ps.filter(ganoR).length;
      return { fecha: t.desde, titulo: t.nombre, futuro, link: `/torneo#${t.id}`,
        icono: futuro ? "📅" : t.logro ? "🏆" : "🥏",
        texto: [t.hito, t.lugar + ".", !futuro && ps.length ? `${v} ${v === 1 ? "victoria" : "victorias"} en ${ps.length} partidos.` : "",
          !futuro && t.logro ? t.logro : "", futuro ? "Próximo desafío." : ""].filter(Boolean).join(" ") };
    }),
  ].sort((a, b) => a.fecha.localeCompare(b.fecha));
  lineaEl.innerHTML = items.map((it) => {
    const f = new Date(it.fecha + "T00:00");
    const linkOk = it.link && /^\/[A-Za-z0-9#/_-]*$/.test(it.link) ? it.link : "";
    return `<li class="hito${it.futuro ? " futuro" : ""}">
      <span class="hito-punto" aria-hidden="true">${conIconos(it.icono || "⭐")}</span>
      <div class="hito-card">
        <time datetime="${escHtml(it.fecha)}">${f.getDate()} ${MC[f.getMonth()]} ${f.getFullYear()}</time>
        <h3>${escHtml(it.titulo)}</h3>
        <p>${conIconos(it.texto)}</p>
        ${linkOk ? `<a href="${escHtml(linkOk)}">${it.futuro ? "Ver torneo" : "Ver resumen"} →</a>` : ""}
      </div>
    </li>`;
  }).join("");
  // la línea se va "llenando" a medida que bajás
  const llenar = () => {
    const r = lineaEl.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    lineaEl.style.setProperty("--prog", (p * 100).toFixed(1) + "%");
  };
  addEventListener("scroll", llenar, { passive: true });
  llenar();
}
