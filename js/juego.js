// Minijuego escondido: tocá la bomba del logo de la portada y atrapá los discos que cruzan la pantalla.
(() => {
  const logo = document.querySelector(".hero-logo");
  if (!logo) return;
  const DURACION = 30;   // segundos por partida
  const COLORES = ["#b44cff", "#ff7a1c", "#31c4ff", "#ffb81c", "#ff3fa4"];
  const leerRecord = () => { try { return +localStorage.getItem("escandalo-record") || 0; } catch (e) { return 0; } };
  const guardarRecord = (n) => { try { localStorage.setItem("escandalo-record", n); } catch (e) {} };

  const capa = document.createElement("div");
  capa.className = "juego";
  capa.setAttribute("role", "dialog");
  capa.setAttribute("aria-modal", "true");
  capa.setAttribute("aria-label", "Minijuego: atrapá el disco");
  capa.innerHTML = `
    <canvas></canvas>
    <div class="juego-hud">
      <span>${ico("disco")} <b id="j-pts">0</b></span><span>${ico("reloj")} <b id="j-tiempo">${DURACION}</b></span><span>Récord <b id="j-rec">0</b></span>
      <button class="juego-x" aria-label="Cerrar">${ico("cerrar")}</button>
    </div>
    <div class="juego-panel" id="j-panel"></div>`;
  document.body.appendChild(capa);
  const cv = capa.querySelector("canvas"), ctx = cv.getContext("2d");
  const $j = (s) => capa.querySelector(s);
  let W = 0, H = 0, discos = [], efectos = [], pts = 0, inicio = 0, ultimo = 0, jugando = false, raf = 0, previo = 0, t = 0;

  function medir() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + "px"; cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function panel(html) { const p = $j("#j-panel"); p.innerHTML = html; p.hidden = !html; }

  function abrir() {
    medir();
    capa.classList.add("open");
    discos = []; efectos = []; pts = 0; jugando = false;
    $j("#j-pts").textContent = 0; $j("#j-tiempo").textContent = DURACION; $j("#j-rec").textContent = leerRecord();
    panel(`<h2>¡Atrapá el disco!</h2>
      <p>Tocá los discos antes de que se escapen de la pantalla.<br>Tenés ${DURACION} segundos.</p>
      <button class="btn" data-j="jugar">Jugar</button>`);
    previo = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(bucle);
  }
  function cerrar() { capa.classList.remove("open"); jugando = false; cancelAnimationFrame(raf); }
  function jugar() {
    panel(""); discos = []; efectos = []; pts = 0; $j("#j-pts").textContent = 0;
    jugando = true; inicio = performance.now(); ultimo = -1;
  }
  function terminar() {
    jugando = false;
    const rec = leerRecord(), nuevo = pts > rec;
    if (nuevo) guardarRecord(pts);
    $j("#j-rec").textContent = Math.max(pts, rec);
    const frase = pts >= 25 ? "Nivel selección. ¿Venís a entrenar con nosotros?"
      : pts >= 15 ? "¡Buenas manos! Ya podés jugar de handler."
      : pts >= 8 ? "Nada mal. Con un par de prácticas más…"
      : "Hay que entrenar más 😅 ¡Te esperamos en la práctica!";
    panel(`<h2>${nuevo && pts > 0 ? "¡Nuevo récord!" : "¡Tiempo!"}</h2>
      <p class="juego-pts"><b>${pts}</b>${pts === 1 ? "disco atrapado" : "discos atrapados"}</p>
      <p>${frase}</p>
      <div class="juego-btns"><button class="btn" data-j="jugar">Jugar de nuevo</button><button class="btn ghost" data-j="salir">Salir</button></div>`);
  }

  function nuevoDisco() {
    const prog = Math.min(1, t / DURACION);                       // se pone más difícil con el tiempo
    const r = Math.max(20, Math.min(40, Math.min(W, H) / 18)) * (1 - prog * 0.25);
    const izq = Math.random() < 0.5;
    const vel = W * (0.22 + prog * 0.35) * (0.8 + Math.random() * 0.5);
    const y0 = H * (0.2 + Math.random() * 0.6);
    discos.push({ x: izq ? -r : W + r, y: y0, y0, vx: izq ? vel : -vel, fase: Math.random() * 6,
      amp: H * (0.03 + Math.random() * 0.08), r, giro: 0, color: COLORES[Math.floor(Math.random() * COLORES.length)], nacio: t });
  }

  function dibujarDisco(d) {
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.fillStyle = "#0000004d";
    ctx.beginPath(); ctx.ellipse(0, d.r * 1.1, d.r * 0.85, d.r * 0.18, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(0, -d.r * 0.15, 2, 0, 0, d.r);
    g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#d6d6e4");
    ctx.shadowColor = d.color; ctx.shadowBlur = 22;
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, d.r, d.r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = d.r * 0.14; ctx.strokeStyle = d.color; ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2; ctx.strokeStyle = d.color + "88";
    ctx.beginPath(); ctx.ellipse(0, 0, d.r * 0.55, d.r * 0.25, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = d.color;
    ctx.beginPath(); ctx.arc(Math.cos(d.giro) * d.r * 0.72, Math.sin(d.giro) * d.r * 0.32, d.r * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function bucle(ahora) {
    raf = requestAnimationFrame(bucle);
    const dt = previo ? Math.min(0.05, (ahora - previo) / 1000) : 0;
    previo = ahora;
    ctx.clearRect(0, 0, W, H);
    if (jugando) {
      t = (ahora - inicio) / 1000;
      const quedan = String(Math.max(0, Math.ceil(DURACION - t)));
      if ($j("#j-tiempo").textContent !== quedan) $j("#j-tiempo").textContent = quedan;
      const intervalo = 0.95 - Math.min(1, t / DURACION) * 0.55;
      if (ultimo < 0 || t - ultimo > intervalo) { nuevoDisco(); ultimo = t; }
      for (const d of discos) {
        d.x += d.vx * dt;
        d.y = d.y0 + Math.sin((t - d.nacio) * 2.2 + d.fase) * d.amp;
        d.giro += dt * 12;
      }
      discos = discos.filter((d) => d.x > -d.r * 2 && d.x < W + d.r * 2);
      if (t >= DURACION) { discos = []; terminar(); }
    }
    for (const d of discos) dibujarDisco(d);
    for (const e of efectos) {
      e.vida -= dt;
      ctx.globalAlpha = Math.max(0, e.vida / e.total);
      if (e.tipo === "chispa") {
        e.x += e.vx * dt; e.y += e.vy * dt; e.vy += 500 * dt;
        ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(e.x, e.y, 3.5, 0, Math.PI * 2); ctx.fill();
      } else if (e.tipo === "texto") {
        e.y -= 60 * dt;
        ctx.fillStyle = "#ffb81c"; ctx.font = "32px Anton, Impact, sans-serif"; ctx.textAlign = "center";
        ctx.fillText("+1", e.x, e.y);
      } else {
        ctx.strokeStyle = "#ffffff66"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(e.x, e.y, 30 * (1 - e.vida / e.total) + 6, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    efectos = efectos.filter((e) => e.vida > 0);
  }

  cv.addEventListener("pointerdown", (ev) => {
    if (!jugando) return;
    const x = ev.clientX, y = ev.clientY;
    for (let i = discos.length - 1; i >= 0; i--) {
      const d = discos[i];
      if (Math.hypot(x - d.x, y - d.y) < d.r * 1.35) {
        discos.splice(i, 1);
        pts++; $j("#j-pts").textContent = pts;
        for (let k = 0; k < 14; k++) {
          const a = Math.random() * Math.PI * 2, v = 120 + Math.random() * 220;
          efectos.push({ tipo: "chispa", x: d.x, y: d.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, color: COLORES[k % COLORES.length], vida: 0.7, total: 0.7 });
        }
        efectos.push({ tipo: "texto", x: d.x, y: d.y - d.r, vida: 0.8, total: 0.8 });
        return;
      }
    }
    efectos.push({ tipo: "aro", x, y, vida: 0.35, total: 0.35 });
  });
  capa.addEventListener("click", (e) => {
    const b = e.target.closest("[data-j]");
    if (b) b.dataset.j === "jugar" ? jugar() : cerrar();
    else if (e.target.closest(".juego-x")) cerrar();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && capa.classList.contains("open")) cerrar(); });
  addEventListener("resize", () => capa.classList.contains("open") && medir());

  // Solo la bomba (el círculo del centro del logo) abre el juego, no el texto
  const enBomba = (ev) => {
    const r = logo.getBoundingClientRect();
    return Math.hypot((ev.clientX - r.left) / r.width - 0.52, ((ev.clientY - r.top) / r.width) - 0.523) < 0.22;
  };
  logo.setAttribute("tabindex", "0");
  logo.setAttribute("aria-label", "Escándalo Ultimate");
  logo.addEventListener("mousemove", (ev) => logo.classList.toggle("sobre-bomba", enBomba(ev)));
  logo.addEventListener("mouseleave", () => logo.classList.remove("sobre-bomba"));
  logo.addEventListener("click", (ev) => { if (enBomba(ev)) abrir(); });
  logo.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); } });
})();
