// Página Ultimate: tarjetas de recursos agrupadas
const TARJETA_QUIZ = `
    <article class="recurso quiz-tarjeta">
      <div class="recurso-tapa quiz-tapa" aria-hidden="true"><span>V</span><span>F</span></div>
      <div class="recurso-info">
        <div class="etiquetas"><span>Interactivo</span><span>10 preguntas</span></div>
        <h3>Quiz de reglas</h3>
        <p>Poné a prueba lo que sabés con preguntas de verdadero o falso. Elegí nivel: fácil, intermedio o experto.</p>
        <div class="recurso-acciones"><button class="btn" data-quiz>Empezar quiz</button></div>
      </div>
    </article>`;
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
    </article>`).join("")}${g === "reglas" ? TARJETA_QUIZ : ""}
  </div>`).join("");
