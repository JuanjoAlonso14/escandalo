// Caja del equipo: balance, ingresos (aportes) y egresos. Lectura para cualquiera con sesión; escritura solo admin.
(() => {
  const ANIO = 2026;
  const MESES = [
    { n: 5, nom: "Mayo" }, { n: 6, nom: "Junio" }, { n: 7, nom: "Julio" }, { n: 8, nom: "Agosto" },
    { n: 9, nom: "Septiembre" }, { n: 10, nom: "Octubre" }, { n: 11, nom: "Noviembre" }, { n: 12, nom: "Diciembre" },
  ];
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const plata = (n) => {
    const v = Number(n) || 0;
    return v.toLocaleString("es-UY", { maximumFractionDigits: 0 });
  };
  const raiz = document.querySelector("#caja");
  if (!raiz) return;

  document.querySelector("#year").textContent = new Date().getFullYear();
  const burger = document.querySelector("#burger"), menu = document.querySelector("#menu");
  if (burger && menu) {
    burger.onclick = () => menu.classList.toggle("open");
    menu.addEventListener("click", () => menu.classList.remove("open"));
  }
  if (typeof TEAM !== "undefined") {
    const ig = document.querySelector("#ig"), wa = document.querySelector("#wa"), mail = document.querySelector("#mail");
    if (ig) ig.href = TEAM.instagram;
    if (wa) wa.href = "https://wa.me/" + TEAM.whatsapp;
    if (mail) mail.href = "mailto:" + TEAM.email;
  }

  const vacio = (t) => (raiz.innerHTML = `<p class="adm-vacio">${t}</p>`);
  let esAdmin = false, jugadores = [], ingresos = [], egresos = [];

  async function pedir(ruta, opciones = {}) {
    const r = await fetch(`${SUPABASE.url}/rest/v1/${ruta}`, {
      ...opciones,
      headers: { ...(await Sesion.headers()), Prefer: "return=representation", ...(opciones.headers || {}) },
      signal: AbortSignal.timeout(8000),
    });
    return r;
  }
  async function rpc(nombre, cuerpo) {
    const r = await pedir(`rpc/${nombre}`, { method: "POST", body: JSON.stringify(cuerpo) });
    if (!r.ok) {
      let c = {}; try { c = await r.clone().json(); } catch (e) {}
      throw new Error(c.message || `Error ${r.status}`);
    }
    return r;
  }

  function sumaMes(lista, mes, campoMonto = "monto") {
    return lista.filter((x) => x.mes === mes).reduce((s, x) => s + Number(x[campoMonto]), 0);
  }

  function abrirModal(html) {
    document.querySelector(".adm-modal")?.remove();
    const m = document.createElement("div");
    m.className = "quiz-modal open adm-modal";
    m.innerHTML = `<div class="quiz-caja">${html}</div>`;
    document.body.appendChild(m);
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-cerrar]")) m.remove(); });
    return m;
  }

  function celdaNum(valor, attrs) {
    const v = Number(valor) || 0;
    const txt = v ? plata(v) : "";
    if (!esAdmin) return `<td class="caja-num">${txt}</td>`;
    return `<td class="caja-num caja-edit" ${attrs} title="Editar">${txt || "·"}</td>`;
  }

  function pintar() {
    const ingPorMes = MESES.map((m) => sumaMes(ingresos, m.n));
    const egrPorMes = MESES.map((m) => sumaMes(egresos, m.n));
    const balPorMes = ingPorMes.map((ing, i) => ing - egrPorMes[i]);
    let saldo = 0;
    const saldoAcum = balPorMes.map((b, i) => {
      if (ingPorMes[i] || egrPorMes[i]) saldo += b;
      return (ingPorMes[i] || egrPorMes[i]) ? saldo : null;
    });
    const saldoFinal = saldoAcum.filter((x) => x != null).pop();

    const filasJug = jugadores.map((j) => {
      const montos = MESES.map((m) => {
        const fila = ingresos.find((x) => x.jugador_slug === j.slug && x.mes === m.n);
        return celdaNum(fila?.monto, `data-aporte data-slug="${esc(j.slug)}" data-mes="${m.n}" data-monto="${fila ? fila.monto : ""}"`);
      }).join("");
      return `<tr><th class="caja-nom">${esc(j.nombre)}</th>${montos}</tr>`;
    }).join("");

    const nombresInv = [...new Set(ingresos.filter((x) => x.invitado).map((x) => x.invitado))]
      .sort((a, b) => a.localeCompare(b, "es"));
    const filasInv = nombresInv.map((nombre) => {
      const montos = MESES.map((m) => {
        const fila = ingresos.find((x) => x.invitado === nombre && x.mes === m.n);
        return celdaNum(fila?.monto, `data-aporte data-invitado="${esc(nombre)}" data-mes="${m.n}" data-monto="${fila ? fila.monto : ""}"`);
      }).join("");
      return `<tr><th class="caja-nom">${esc(nombre)}</th>${montos}</tr>`;
    }).join("");

    const conceptos = [...new Set(egresos.map((x) => x.concepto))].sort((a, b) => a.localeCompare(b, "es"));
    const filasEgr = (conceptos.length ? conceptos : ["Cancha"]).map((concepto) => {
      const montos = MESES.map((m) => {
        const fila = egresos.find((x) => x.concepto === concepto && x.mes === m.n);
        return celdaNum(fila?.monto, `data-egreso data-concepto="${esc(concepto)}" data-mes="${m.n}" data-monto="${fila ? fila.monto : ""}"`);
      }).join("");
      return `<tr><th class="caja-nom">${esc(concepto)}</th>${montos}</tr>`;
    }).join("");

    const thMeses = MESES.map((m) => `<th>${m.nom}</th>`).join("");
    const clsBal = (n) => (n > 0 ? "pos" : n < 0 ? "neg" : "");

    raiz.innerHTML = `
      <div class="adm-cab">
        <div><h1 class="title">Caja del <span>equipo</span></h1>
          <p class="caja-sub">${ANIO} · mayo a diciembre${esAdmin ? " · podés cargar aportes y egresos" : ""}</p></div>
        ${esAdmin ? `<div class="caja-acciones">
          <button class="btn" data-nuevo-aporte>${ico("mas")} Cargar aporte</button>
          <button class="btn ghost" data-nuevo-egreso>${ico("mas")} Cargar egreso</button>
        </div>` : ""}
      </div>

      <h2 class="grupo-ult">Balance</h2>
      <div class="caja-tabla"><table>
        <thead><tr><th></th>${thMeses}</tr></thead>
        <tbody>
          <tr><th class="caja-nom">Ingresos</th>${ingPorMes.map((n) => `<td class="caja-num">${n ? plata(n) : ""}</td>`).join("")}</tr>
          <tr><th class="caja-nom">Egresos</th>${egrPorMes.map((n) => `<td class="caja-num">${n ? plata(n) : ""}</td>`).join("")}</tr>
          <tr class="caja-resaltar"><th class="caja-nom">Balance</th>${balPorMes.map((n, i) => `<td class="caja-num ${clsBal(n)}">${(ingPorMes[i] || egrPorMes[i]) ? plata(n) : ""}</td>`).join("")}</tr>
        </tbody>
      </table></div>
      <p class="caja-saldo">Saldo de caja: <b class="${clsBal(saldoFinal ?? 0)}">${saldoFinal == null ? "—" : plata(saldoFinal)}</b></p>

      <h2 class="grupo-ult">Ingresos</h2>
      <div class="caja-tabla"><table>
        <thead><tr><th>Jugador</th>${thMeses}</tr></thead>
        <tbody>
          ${filasJug || `<tr><td colspan="${MESES.length + 1}" class="caja-vacio">Sin jugadores</td></tr>`}
          <tr class="caja-sep"><th colspan="${MESES.length + 1}">Jugador invitado</th></tr>
          ${filasInv || `<tr><td colspan="${MESES.length + 1}" class="caja-vacio">Todavía no hay invitados cargados</td></tr>`}
          <tr class="caja-resaltar"><th class="caja-nom">Total</th>${ingPorMes.map((n) => `<td class="caja-num">${n ? plata(n) : ""}</td>`).join("")}</tr>
        </tbody>
      </table></div>

      <h2 class="grupo-ult">Egresos</h2>
      <div class="caja-tabla"><table>
        <thead><tr><th>Gasto</th>${thMeses}</tr></thead>
        <tbody>
          ${filasEgr}
          <tr class="caja-resaltar"><th class="caja-nom">Total</th>${egrPorMes.map((n) => `<td class="caja-num">${n ? plata(n) : ""}</td>`).join("")}</tr>
        </tbody>
      </table></div>`;
  }

  function formAporte({ slug, invitado, mes, monto } = {}) {
    const optsJug = jugadores.map((j) => `<option value="${esc(j.slug)}" ${j.slug === slug ? "selected" : ""}>${esc(j.nombre)}</option>`).join("");
    const optsMes = MESES.map((m) => `<option value="${m.n}" ${m.n === Number(mes) ? "selected" : ""}>${m.nom}</option>`).join("");
    const tipo = invitado ? "invitado" : "jugador";
    const m = abrirModal(`
      <div class="quiz-top"><span>${monto ? "Editar aporte" : "Cargar aporte"}</span><button class="quiz-x" data-cerrar aria-label="Cerrar">${ico("cerrar")}</button></div>
      <form class="adm-form" novalidate>
        <label>Quién
          <select name="tipo">
            <option value="jugador" ${tipo === "jugador" ? "selected" : ""}>Jugador del equipo</option>
            <option value="invitado" ${tipo === "invitado" ? "selected" : ""}>Jugador invitado</option>
          </select>
        </label>
        <label data-campo="jugador">Jugador<select name="slug"><option value="">Elegí…</option>${optsJug}</select></label>
        <label data-campo="invitado" hidden>Nombre del invitado<input name="invitado" value="${esc(invitado || "")}" placeholder="Ej: Tonga"></label>
        <div class="adm-fila">
          <label>Mes<select name="mes">${optsMes}</select></label>
          <label>Monto<input name="monto" type="number" min="0" step="1" value="${monto || ""}" placeholder="300"></label>
        </div>
        <p class="caja-ayuda">Dejá el monto en 0 para borrar ese aporte.</p>
        <small class="adm-error" aria-live="polite"></small>
        <div class="adm-botones"><button type="button" class="btn ghost" data-cerrar>Cancelar</button><button class="btn" type="submit">Guardar</button></div>
      </form>`);
    const f = m.querySelector("form"), err = f.querySelector(".adm-error");
    const syncTipo = () => {
      const inv = f.tipo.value === "invitado";
      f.querySelector('[data-campo="jugador"]').hidden = inv;
      f.querySelector('[data-campo="invitado"]').hidden = !inv;
    };
    syncTipo();
    f.tipo.addEventListener("change", syncTipo);
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); err.textContent = "";
      const mesN = Number(f.mes.value), montoN = f.monto.value === "" ? 0 : Number(f.monto.value);
      if (!Number.isFinite(montoN) || montoN < 0) return (err.textContent = "El monto no es válido.");
      let jugador_slug = null, inv = null;
      if (f.tipo.value === "jugador") {
        jugador_slug = f.slug.value || null;
        if (!jugador_slug) return (err.textContent = "Elegí el jugador.");
      } else {
        inv = f.invitado.value.trim();
        if (!inv) return (err.textContent = "Escribí el nombre del invitado.");
      }
      const boton = f.querySelector('[type="submit"]'); boton.disabled = true;
      try {
        await rpc("guardar_caja_ingreso", { p_anio: ANIO, p_mes: mesN, p_monto: montoN || null, p_jugador_slug: jugador_slug, p_invitado: inv });
        m.remove(); await cargar();
      } catch (er) { err.textContent = er.message; boton.disabled = false; }
    });
  }

  function formEgreso({ concepto, mes, monto } = {}) {
    const optsMes = MESES.map((m) => `<option value="${m.n}" ${m.n === Number(mes) ? "selected" : ""}>${m.nom}</option>`).join("");
    const m = abrirModal(`
      <div class="quiz-top"><span>${monto ? "Editar egreso" : "Cargar egreso"}</span><button class="quiz-x" data-cerrar aria-label="Cerrar">${ico("cerrar")}</button></div>
      <form class="adm-form" novalidate>
        <label>Concepto<input name="concepto" value="${esc(concepto || "Cancha")}" placeholder="Ej: Cancha" list="caja-conceptos"></label>
        <datalist id="caja-conceptos">${[...new Set(egresos.map((x) => x.concepto))].map((c) => `<option value="${esc(c)}">`).join("")}</datalist>
        <div class="adm-fila">
          <label>Mes<select name="mes">${optsMes}</select></label>
          <label>Monto<input name="monto" type="number" min="0" step="1" value="${monto || ""}" placeholder="5000"></label>
        </div>
        <p class="caja-ayuda">Dejá el monto en 0 para borrar ese egreso.</p>
        <small class="adm-error" aria-live="polite"></small>
        <div class="adm-botones"><button type="button" class="btn ghost" data-cerrar>Cancelar</button><button class="btn" type="submit">Guardar</button></div>
      </form>`);
    const f = m.querySelector("form"), err = f.querySelector(".adm-error");
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); err.textContent = "";
      const conceptoTxt = f.concepto.value.trim(), mesN = Number(f.mes.value), montoN = f.monto.value === "" ? 0 : Number(f.monto.value);
      if (!conceptoTxt) return (err.textContent = "Escribí el concepto.");
      if (!Number.isFinite(montoN) || montoN < 0) return (err.textContent = "El monto no es válido.");
      const boton = f.querySelector('[type="submit"]'); boton.disabled = true;
      try {
        await rpc("guardar_caja_egreso", { p_anio: ANIO, p_mes: mesN, p_concepto: conceptoTxt, p_monto: montoN || null });
        m.remove(); await cargar();
      } catch (er) { err.textContent = er.message; boton.disabled = false; }
    });
  }

  raiz.addEventListener("click", (e) => {
    if (e.target.closest("[data-nuevo-aporte]")) return formAporte({});
    if (e.target.closest("[data-nuevo-egreso]")) return formEgreso({});
    const cel = e.target.closest(".caja-edit");
    if (!cel || !esAdmin) return;
    if (cel.hasAttribute("data-aporte")) {
      return formAporte({
        slug: cel.dataset.slug || "",
        invitado: cel.dataset.invitado || "",
        mes: cel.dataset.mes,
        monto: cel.dataset.monto,
      });
    }
    if (cel.hasAttribute("data-egreso")) {
      return formEgreso({ concepto: cel.dataset.concepto, mes: cel.dataset.mes, monto: cel.dataset.monto });
    }
  });

  async function cargar() {
    const [rJ, rI, rE] = await Promise.all([
      pedir("jugadores?select=slug,nombre,apodo,activo&activo=eq.true&order=nombre.asc"),
      pedir(`caja_ingresos?select=*&anio=eq.${ANIO}&order=mes.asc`),
      pedir(`caja_egresos?select=*&anio=eq.${ANIO}&order=mes.asc`),
    ]);
    if (!rJ.ok || !rI.ok || !rE.ok) throw new Error("No se pudo leer la caja.");
    jugadores = await rJ.json();
    ingresos = await rI.json();
    egresos = await rE.json();
    pintar();
  }

  (async () => {
    if (typeof SUPABASE === "undefined" || !SUPABASE) return vacio("La caja todavía no está disponible en el sitio publicado.");
    if (!(await Sesion.token())) { location.href = "/login"; return; }
    try {
      esAdmin = (await Sesion.rol()) === "admin";
      await cargar();
    } catch (e) { vacio(`No se pudo cargar la caja: ${esc(e.message)}`); }
  })();
})();
