/* ============================================================
   Reclama Virtual — INDECOPI · Asistente de chat con IA (Gemini)
   - Inyecta el widget (FAB + panel) en todas las páginas.
   - Bienvenida automática + canales de contacto inmediato.
   - Conversación en tiempo real con Gemini (cliente directo).
   - Degradación elegante si no hay API key configurada.
   ============================================================ */
(function () {
  "use strict";

  var CONTACTO = window.CONTACTO_INDECOPI || { telefono: "0-800-4-4040", correo: "sacreclamo@indecopi.gob.pe" };

  var SYSTEM_PROMPT =
    "Eres Carlos Pérez, el asesor virtual de 'Reclama Virtual' de INDECOPI (Perú), el portal donde " +
    "los ciudadanos registran reclamos de consumo. PERSONALIDAD: profesional y confiable, pero " +
    "cercano y amigable; transmites calma y seguridad para reducir la ansiedad de quien reclama. " +
    "Te presentas como Carlos la primera vez y hablas en primera persona ('yo te ayudo'). " +
    "Usas un trato cordial de 'tú'. " +
    "FORMATO Y ESTILO (IMPORTANTE): sé MUY CONCISO, responde en 1-3 frases cortas; NO te sobre-expliques " +
    "para no aburrir al usuario. Usa lenguaje simple (evita tecnicismos; si usas uno, explícalo en pocas " +
    "palabras). Resalta lo clave con **negritas** (formato markdown de doble asterisco). Usa 1-2 emojis " +
    "con moderación (p. ej. 😊 ✅ 📞). " +
    "CONOCIMIENTO DE LOS PASOS (úsalo para orientar según dónde esté el usuario): " +
    "Paso 1 'Cuéntanos tu reclamo' = cómo y cuándo compró, si ya avisó a la empresa, **qué pasó**, " +
    "**qué solicita** (la medida correctiva: devolución, cambio o reparación), adjuntar boleta/evidencia " +
    "y elegir la sede de INDECOPI. " +
    "Paso 2 'Identifica al reclamado' = elegir si es **empresa** (persona jurídica, con RUC) o **persona " +
    "natural** (con DNI), y poner su nombre/razón social y dirección. " +
    "Paso 3 'Tus datos' = tipo y número de documento, nombres y apellidos, dirección, **correo y celular** " +
    "(ahí se notifica el caso). Al enviar se genera un **número de expediente** y se descarga el comprobante. " +
    "MISIÓN: guiar esos 3 pasos y ayudar a redactar qué pasó y qué solicita. " +
    "LÍMITES: nunca inventes números de expediente, montos ni plazos legales que no conozcas; " +
    "ante una duda legal compleja deriva con seguridad a la línea gratuita " + CONTACTO.telefono +
    " o al correo " + CONTACTO.correo + ". No pidas datos sensibles innecesarios. " +
    "Mantén siempre un tono que inspire confianza institucional.";

  var panelAbierto = false;
  var HKEY = "carlosHistorial";        // historial persistente entre pasos
  var SKEY = "carlosPasosSaludados";   // pasos ya saludados (evita repetir)

  function configurado() {
    var k = window.GEMINI_API_KEY;
    return !!k && k !== "PON_TU_API_KEY_AQUI" && k.trim().length > 10;
  }

  /* ---------- Historial persistente (sessionStorage) ----------
     Cada mensaje: { role:'user'|'model', html, plain } */
  function getHist() { try { return JSON.parse(sessionStorage.getItem(HKEY)) || []; } catch (e) { return []; } }
  function setHist(h) { try { sessionStorage.setItem(HKEY, JSON.stringify(h)); } catch (e) {} }
  function pushMsg(role, html, plain) {
    var h = getHist();
    h.push({ role: role, html: html, plain: plain || stripHtml(html) });
    setHist(h);
    return h[h.length - 1];
  }
  function stripHtml(s) {
    var d = document.createElement("div");
    d.innerHTML = String(s);
    return (d.textContent || "").replace(/\s+/g, " ").trim();
  }

  /* ---------- Detección del paso actual ---------- */
  function pasoActual() {
    var p = (location.pathname || "").toLowerCase();
    if (p.indexOf("paso1") >= 0) return "paso1";
    if (p.indexOf("paso2") >= 0) return "paso2";
    if (p.indexOf("paso3") >= 0) return "paso3";
    if (p.indexOf("exito") >= 0) return "exito";
    return "landing";
  }

  // Mensajes proactivos por paso (concisos y con negritas)
  var STEP_MSG = {
    paso1: "📝 Estás en el <strong>Paso 1: Cuéntanos tu reclamo</strong>. Describe <strong>qué pasó</strong> y <strong>qué solicitas</strong> (tu medida correctiva). Si te trabas, dímelo y lo redactamos juntos. 😊",
    paso2: "🏢 <strong>Paso 2: Identifica al reclamado</strong>. Indica la <strong>empresa o persona</strong> contra la que reclamas. ¿No tienes el RUC? Escribe el nombre y te ayudo.",
    paso3: "🙋 <strong>Paso 3: Tus datos</strong>. Completa tu <strong>documento y contacto</strong> para poder notificarte. ¡Ya casi terminas! ✅",
    exito: "🎉 <strong>¡Listo, lo lograste!</strong> Tu reclamo fue enviado. Guarda tu <strong>número de expediente</strong> y descarga tu comprobante. ¿Te ayudo con algo más?"
  };

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // Texto plano → HTML simple (saltos de línea y **negritas**)
  function formato(texto) {
    return escapeHtml(texto)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  }

  /* ---------- Construcción del widget ---------- */
  function construir() {
    var wrap = document.createElement("div");
    wrap.id = "ai-chat";
    wrap.innerHTML =
      // Panel
      '<div id="chat-panel" class="hidden fixed bottom-24 right-4 sm:right-6 z-[70] w-[calc(100vw-2rem)] sm:w-[380px] max-w-[380px] h-[70vh] sm:h-[520px] bg-white rounded-xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden">' +
        '<div class="bg-secondary text-on-primary px-4 py-3 flex items-center gap-3 flex-shrink-0">' +
          '<div class="relative"><div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center"><span class="material-symbols-outlined fill">support_agent</span></div>' +
          '<span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-secondary rounded-full"></span></div>' +
          '<div class="flex-1 leading-tight"><p class="font-bold">Carlos Pérez</p><p class="text-xs text-on-primary/70">Asesor virtual · En línea</p></div>' +
          '<button id="chat-close" class="hover:bg-white/15 rounded-full p-1 transition-colors" aria-label="Cerrar chat"><span class="material-symbols-outlined">close</span></button>' +
        '</div>' +
        '<div id="chat-messages" class="flex-1 overflow-y-auto p-4 space-y-3 bg-surface"></div>' +
        '<div class="p-3 border-t border-outline-variant bg-white flex-shrink-0">' +
          '<div class="flex items-end gap-2">' +
            '<textarea id="chat-input" rows="1" placeholder="Escribe tu pregunta…" class="flex-1 resize-none max-h-28 rounded-2xl border-2 border-outline-variant px-4 py-2.5 focus:border-primary focus:ring-0 outline-none text-body-md"></textarea>' +
            '<button id="chat-send" class="w-11 h-11 flex-shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center hover:brightness-110 active:scale-95 transition-all disabled:opacity-40" aria-label="Enviar"><span class="material-symbols-outlined fill">send</span></button>' +
          '</div>' +
          '<p class="text-[11px] text-on-surface-variant/70 text-center mt-2">Asistente con IA · puede cometer errores. Para casos urgentes llama al ' + CONTACTO.telefono + '.</p>' +
        '</div>' +
      '</div>' +
      // Teaser de bienvenida
      '<div id="chat-teaser" class="hidden fixed bottom-24 right-4 sm:right-6 z-[65] w-[260px] bg-white rounded-xl shadow-2xl border border-outline-variant p-4 chat-bubble cursor-pointer">' +
        '<button id="teaser-close" class="absolute top-2 right-2 text-on-surface-variant/50 hover:text-on-surface-variant" aria-label="Cerrar"><span class="material-symbols-outlined text-base">close</span></button>' +
        '<div class="flex items-start gap-3"><div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined text-white fill text-xl">support_agent</span></div>' +
        '<p id="teaser-text" class="text-body-md text-on-surface leading-snug">👋 ¡Hola! Soy <strong>Carlos Pérez</strong>, tu asesor. ¿Necesitas ayuda con tu reclamo? Escríbeme, estoy para guiarte. 😊</p></div>' +
      '</div>' +
      // FAB
      '<button id="chat-fab" class="fixed bottom-6 right-4 sm:right-6 z-[60] flex items-center gap-3 bg-tertiary text-on-tertiary h-16 pl-5 pr-6 rounded-full shadow-2xl border-4 border-white hover:scale-105 active:scale-95 transition-all chat-fab-pulse" aria-label="Abrir asistente de ayuda">' +
        '<span class="material-symbols-outlined text-3xl">forum</span>' +
        '<span class="font-bold hidden sm:block whitespace-nowrap">¿Necesitas ayuda?</span>' +
        '<span id="chat-fab-dot" class="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-xs font-bold rounded-full items-center justify-center border-2 border-white" style="display:none">1</span>' +
      '</button>';
    document.body.appendChild(wrap);

    document.getElementById("chat-fab").addEventListener("click", abrirPanel);
    document.getElementById("chat-close").addEventListener("click", cerrarPanel);
    document.getElementById("chat-send").addEventListener("click", onSend);
    var input = document.getElementById("chat-input");
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
    });
    input.addEventListener("input", function () {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 112) + "px";
    });

    var teaser = document.getElementById("chat-teaser");
    teaser.addEventListener("click", function (e) {
      if (e.target.closest("#teaser-close")) { ocultarTeaser(); return; }
      abrirPanel();
    });
    document.getElementById("teaser-close").addEventListener("click", function (e) {
      e.stopPropagation(); ocultarTeaser();
    });

    // Sembrar bienvenida la primera vez y pintar el historial acumulado
    if (getHist().length === 0) addBienvenida();
    renderHistorial();

    // Mensaje proactivo del paso actual (una sola vez por paso en la sesión)
    var nuevo = saludarPaso();

    // Teaser/aviso: si hay mensaje nuevo del paso o es la primera vez en la sesión
    if (!sessionStorage.getItem("teaserVisto") || nuevo) {
      if (nuevo) {
        var tt = document.getElementById("teaser-text");
        if (tt) tt.innerHTML = "💬 <strong>Carlos Pérez</strong> te dejó un mensaje sobre este paso. Toca para verlo.";
      }
      setTimeout(function () {
        if (!panelAbierto) {
          document.getElementById("chat-teaser").classList.remove("hidden");
          mostrarDot();
        }
      }, nuevo ? 700 : 1500);
    }
  }

  /* ---------- Pintar todo el historial guardado ---------- */
  function renderHistorial() {
    var cont = document.getElementById("chat-messages");
    cont.innerHTML = "";
    getHist().forEach(function (m) { pintarBurbuja(m.role, m.html, true); });
  }

  /* ---------- Saludo proactivo según el paso (una vez por sesión) ---------- */
  function saludarPaso() {
    var step = pasoActual();
    if (step === "landing" || !STEP_MSG[step]) return false;
    var saludados;
    try { saludados = JSON.parse(sessionStorage.getItem(SKEY)) || []; } catch (e) { saludados = []; }
    if (saludados.indexOf(step) >= 0) return false;
    saludados.push(step);
    try { sessionStorage.setItem(SKEY, JSON.stringify(saludados)); } catch (e) {}
    pushMsg("model", STEP_MSG[step]);
    pintarBurbuja("model", STEP_MSG[step], true);
    return true;
  }

  function mostrarDot() {
    var dot = document.getElementById("chat-fab-dot");
    if (dot && !panelAbierto) dot.style.display = "flex";
  }

  function ocultarTeaser() {
    var t = document.getElementById("chat-teaser");
    if (t) t.classList.add("hidden");
    try { sessionStorage.setItem("teaserVisto", "1"); } catch (e) {}
  }

  /* ---------- Apertura / cierre ---------- */
  function abrirPanel() {
    panelAbierto = true;
    ocultarTeaser();
    document.getElementById("chat-panel").classList.remove("hidden");
    document.getElementById("chat-fab").classList.add("hidden");
    var dot = document.getElementById("chat-fab-dot");
    if (dot) dot.style.display = "none";
    var cont = document.getElementById("chat-messages");
    if (cont) cont.scrollTop = cont.scrollHeight;
    setTimeout(function () { document.getElementById("chat-input").focus(); }, 100);
  }
  function cerrarPanel() {
    panelAbierto = false;
    document.getElementById("chat-panel").classList.add("hidden");
    document.getElementById("chat-fab").classList.remove("hidden");
  }

  /* ---------- Mensaje de bienvenida + canales (se guarda en historial) ---------- */
  function addBienvenida() {
    var html =
      "👋 <strong>¡Hola! Soy Carlos Pérez, tu asesor de Reclama Virtual.</strong><br>" +
      "Estoy aquí para acompañarte paso a paso en tu reclamo, con toda tranquilidad. 😊" +
      (configurado() ? "<br>Cuéntame, ¿en qué te ayudo?" :
        "<br>Cuéntame qué necesitas y te oriento.") +
      '<div class="mt-3 pt-3 border-t border-outline-variant text-helper-text space-y-1">' +
        '<p class="font-bold text-secondary">¿Prefieres atención directa?</p>' +
        '<a href="tel:' + CONTACTO.telefono.replace(/[^0-9]/g, "") + '" class="flex items-center gap-2 text-primary font-bold hover:underline"><span class="material-symbols-outlined text-base">call</span>' + CONTACTO.telefono + ' (gratis)</a>' +
        '<a href="mailto:' + CONTACTO.correo + '" class="flex items-center gap-2 text-primary font-bold hover:underline"><span class="material-symbols-outlined text-base">mail</span>' + CONTACTO.correo + '</a>' +
      '</div>';
    pushMsg("model", html, "Hola, soy Carlos Pérez, tu asesor de Reclama Virtual de INDECOPI. Te guío en tu reclamo.");
  }

  /* ---------- Render de burbujas ---------- */
  function pintarBurbuja(role, html, esHtml) {
    var cont = document.getElementById("chat-messages");
    var row = document.createElement("div");
    var esUsuario = role === "user";
    row.className = "flex " + (esUsuario ? "justify-end" : "justify-start");
    var burbuja = document.createElement("div");
    burbuja.className = esUsuario
      ? "max-w-[80%] bg-primary text-on-primary rounded-2xl rounded-br-md px-4 py-2.5 text-body-md shadow-sm"
      : "max-w-[85%] bg-white text-on-surface border border-outline-variant rounded-2xl rounded-bl-md px-4 py-2.5 text-body-md shadow-sm";
    burbuja.innerHTML = esHtml ? html : formato(html);
    row.appendChild(burbuja);
    cont.appendChild(row);
    cont.scrollTop = cont.scrollHeight;
    return row;
  }

  function mostrarTyping() {
    var cont = document.getElementById("chat-messages");
    var row = document.createElement("div");
    row.id = "typing-row";
    row.className = "flex justify-start";
    row.innerHTML = '<div class="bg-white border border-outline-variant rounded-2xl rounded-bl-md px-4 py-3 shadow-sm"><div class="typing-dots"><span></span><span></span><span></span></div></div>';
    cont.appendChild(row);
    cont.scrollTop = cont.scrollHeight;
  }
  function quitarTyping() {
    var t = document.getElementById("typing-row");
    if (t) t.remove();
  }

  /* ---------- Envío ---------- */
  function onSend() {
    var input = document.getElementById("chat-input");
    var texto = input.value.trim();
    if (!texto) return;
    input.value = "";
    input.style.height = "auto";
    pintarBurbuja("user", formato(texto), true);
    pushMsg("user", formato(texto), texto);
    responder();
  }

  function responder() {
    var sendBtn = document.getElementById("chat-send");
    sendBtn.disabled = true;
    mostrarTyping();

    if (!configurado()) {
      // Fallback amable sin IA
      setTimeout(function () {
        quitarTyping();
        var msg =
          "Gracias por tu mensaje. 🙏 El asistente con IA aún <strong>no está activado</strong> en esta demo, " +
          "pero puedes recibir atención inmediata por estos canales:<br>" +
          '<a href="tel:' + CONTACTO.telefono.replace(/[^0-9]/g, "") + '" class="flex items-center gap-2 text-primary font-bold hover:underline mt-2"><span class="material-symbols-outlined text-base">call</span>' + CONTACTO.telefono + ' (gratis)</a>' +
          '<a href="mailto:' + CONTACTO.correo + '" class="flex items-center gap-2 text-primary font-bold hover:underline"><span class="material-symbols-outlined text-base">mail</span>' + CONTACTO.correo + '</a>';
        pushMsg("model", msg);
        pintarBurbuja("model", msg, true);
        sendBtn.disabled = false;
      }, 600);
      return;
    }

    enviarAGemini()
      .then(function (respuesta) {
        quitarTyping();
        pushMsg("model", formato(respuesta), respuesta);
        pintarBurbuja("model", formato(respuesta), true);
      })
      .catch(function (err) {
        quitarTyping();
        console.error("Gemini error:", err);
        var msg = "Ups, no pude conectarme en este momento. 😕 Inténtalo de nuevo o comunícate al " +
          "<strong>" + CONTACTO.telefono + "</strong> (gratis) o " + CONTACTO.correo + ".";
        pintarBurbuja("model", msg, true);
      })
      .finally(function () {
        sendBtn.disabled = false;
      });
  }

  /* ---------- Llamada a Gemini (única función de red) ----------
     Construye los 'contents' desde el historial persistente.
     Para producción: reemplaza el cuerpo por un fetch a tu backend
     proxy (p.ej. POST /api/chat con { messages }) y NO expongas la key. */
  function enviarAGemini() {
    var model = window.GEMINI_MODEL || "gemini-3.1-flash-lite";
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" +
      model + ":generateContent?key=" + encodeURIComponent(window.GEMINI_API_KEY);

    // Mapear historial → contents; recortar al primer turno 'user' (Gemini exige iniciar en user)
    var items = getHist().filter(function (m) { return m.role === "user" || m.role === "model"; });
    while (items.length && items[0].role !== "user") items.shift();
    // Fusionar turnos consecutivos del mismo rol (Gemini requiere alternancia user/model)
    var contents = [];
    items.forEach(function (m) {
      var txt = m.plain || stripHtml(m.html);
      var last = contents[contents.length - 1];
      if (last && last.role === m.role) {
        last.parts[0].text += "\n" + txt;
      } else {
        contents.push({ role: m.role, parts: [{ text: txt }] });
      }
    });

    var body = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: contents,
      generationConfig: { temperature: 0.6, maxOutputTokens: 400, topP: 0.9 }
    };

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) { throw new Error("HTTP " + res.status + ": " + t); });
      }
      return res.json();
    }).then(function (data) {
      var cand = data && data.candidates && data.candidates[0];
      var parts = cand && cand.content && cand.content.parts;
      var texto = parts && parts.map(function (p) { return p.text || ""; }).join("").trim();
      if (!texto) throw new Error("Respuesta vacía de Gemini");
      return texto;
    });
  }

  // Expuesto por si se quiere abrir el chat desde otros botones
  window.abrirChat = abrirPanel;

  document.addEventListener("DOMContentLoaded", construir);
})();
