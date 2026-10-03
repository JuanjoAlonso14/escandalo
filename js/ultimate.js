// Página Ultimate: tarjetas de recursos agrupadas
const GRUPOS = [
  ["reglas", "Reglamento", "Lo esencial para jugar"],
  ["visual", "Guías visuales", "Para aprender rápido y resolver jugadas"],
  ["avanzado", "Para profundizar", "Material oficial complementario (en inglés)"],
];
document.querySelector("#recursos").innerHTML = GRUPOS.map(([g, titulo, sub]) => `
  <h2 class="grupo-ult">${titulo} <small>${sub}</small></h2>
  <div class="grid recursos">${RECURSOS.filter((r) => r.grupo === g).map((r) => `
    <article class="recurso">
      <a class="recurso-tapa" href="assets/${r.pdf}" target="_blank" rel="noopener" aria-label="Ver ${r.titulo}">
        <img src="assets/${r.portada}" alt="" loading="lazy">
      </a>
      <div class="recurso-info">
        <div class="etiquetas"><span>${r.idioma === "ES" ? "Español" : "Inglés"}</span><span>${r.paginas} ${r.paginas === 1 ? "página" : "páginas"}</span></div>
        <h3>${r.titulo}</h3>
        <p>${r.desc}</p>
        <div class="recurso-acciones">
          <a class="btn" href="assets/${r.pdf}" target="_blank" rel="noopener">Ver</a>
          <a class="btn ghost" href="assets/${r.pdf}" download>Descargar</a>
        </div>
      </div>
    </article>`).join("")}
  </div>`).join("");
