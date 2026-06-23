/* ============================================================
   Reclama Virtual — INDECOPI
   Lógica compartida: persistencia (localStorage), navegación,
   contadores, toggles, envío, descarga de comprobante y chat.
   ============================================================ */
(function () {
  "use strict";

  var STORE_KEY = "reclamoIndecopi";

  /* ---------- Estado persistente ---------- */
  function getData() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function setData(d) {
    localStorage.setItem(STORE_KEY, JSON.stringify(d));
  }
  function set(key, value) {
    var d = getData();
    d[key] = value;
    setData(d);
  }
  function get(key) {
    return getData()[key];
  }

  /* ---------- Etiquetas de categoría ---------- */
  var CATS = {
    "Servicios Bancarios y Financieros": "account_balance",
    "Transporte": "directions_bus",
    "Colegios y Educación": "school",
    "Llamadas y publicidad no deseada": "phonelink_ring",
    "Otros": "more_horiz"
  };

  /* ---------- Selección de categoría (landing) ---------- */
  window.pickCat = function (name, icon) {
    set("categoria", name);
    set("categoriaIcono", icon || CATS[name] || "description");
    window.location.href = "paso1.html";
  };

  /* ---------- Navegación entre pasos ---------- */
  window.irA = function (url) {
    window.location.href = url;
  };

  /* ---------- Modal tutorial (landing) ---------- */
  window.closeModal = function () {
    var m = document.getElementById("modal-overlay");
    if (m) m.style.display = "none";
    try { localStorage.setItem("tutorialVisto", "1"); } catch (e) {}
  };
  window.openModal = function () {
    var m = document.getElementById("modal-overlay");
    if (m) m.style.display = "flex";
  };

  /* ---------- Chat flotante (el widget vive en chat.js) ---------- */
  window.toggleChat = function () {
    if (window.abrirChat) window.abrirChat();
  };

  /* ---------- Envío del reclamo (paso 3) ---------- */
  window.enviarReclamo = function () {
    var num = "RC-2026-" + Math.floor(10000 + Math.random() * 90000);
    set("expediente", num);
    set("fechaEnvio", new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" }));
    set("horaEnvio", new Date().toLocaleTimeString("es-PE"));
    window.location.href = "exito.html";
  };

  /* ---------- Poblar el template del comprobante (pantalla de éxito) ---------- */
  function fill(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value || "—";
  }
  function poblarComprobante() {
    var d = getData();
    var nombre = [d.nombres, d.apPaterno, d.apMaterno].filter(Boolean).join(" ").trim();
    fill("cmp-num", d.expediente || "RC-2026-00000");
    fill("cmp-fecha", (d.fechaEnvio || "") + (d.horaEnvio ? " · " + d.horaEnvio : ""));
    fill("cmp-categoria", d.categoria);
    fill("cmp-sede", d.sede || "No especificada");
    fill("cmp-recl-nombre", nombre);
    fill("cmp-recl-doc", (d.docTipo || "DNI") + " " + (d.docNum || ""));
    fill("cmp-recl-correo", d.correo);
    fill("cmp-recl-cel", d.celular);
    fill("cmp-reclamado-tipo", d.reclamadoTipo === "persona" ? "Persona natural" : "Empresa (persona jurídica)");
    fill("cmp-reclamado-doc", d.reclamadoDoc);
    fill("cmp-reclamado-nombre", d.reclamadoNombre);
    fill("cmp-quepaso", d.queReclamo);
    fill("cmp-quesolicita", d.quePido);
  }

  /* ---------- Descargar comprobante (PNG nítido con html-to-image) ---------- */
  window.descargarComprobante = function () {
    var node = document.getElementById("comprobante-template");
    if (!node || typeof htmlToImage === "undefined") {
      alert("No se pudo generar el comprobante. Recarga la página e inténtalo de nuevo.");
      return;
    }
    var btn = document.getElementById("btn-descargar");
    var original = btn ? btn.innerHTML : null;
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Generando…'; }

    var card = node.querySelector(".comprobante");
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

    ready.then(function () {
      return htmlToImage.toPng(card, {
        pixelRatio: 3,
        backgroundColor: "#ffffff",
        cacheBust: true,
        width: card.offsetWidth,
        height: card.offsetHeight
      });
    }).then(function (dataUrl) {
      var a = document.createElement("a");
      a.href = dataUrl;
      a.download = "Comprobante-INDECOPI-" + (getData().expediente || "reclamo") + ".png";
      a.click();
    }).catch(function (err) {
      console.error("Error al generar PNG:", err);
      alert("No se pudo generar la imagen del comprobante. Verifica tu conexión e inténtalo de nuevo.");
    }).finally(function () {
      if (btn && original !== null) { btn.disabled = false; btn.innerHTML = original; }
    });
  };

  /* ---------- Tooltips de términos técnicos (tap en móvil) ---------- */
  function initTooltips() {
    document.querySelectorAll(".tip").forEach(function (t) {
      t.setAttribute("tabindex", "0");
      t.setAttribute("role", "button");
      t.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var abierto = t.classList.contains("open");
        document.querySelectorAll(".tip.open").forEach(function (o) { o.classList.remove("open"); });
        if (!abierto) t.classList.add("open");
      });
    });
    document.addEventListener("click", function () {
      document.querySelectorAll(".tip.open").forEach(function (o) { o.classList.remove("open"); });
    });
  }

  /* ---------- Inicialización por página ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    var data = getData();

    /* Rellenar la categoría seleccionada donde corresponda */
    document.querySelectorAll("[data-cat-name]").forEach(function (el) {
      el.textContent = data.categoria || "Otros";
    });
    document.querySelectorAll("[data-cat-icon]").forEach(function (el) {
      el.textContent = data.categoriaIcono || "description";
    });

    /* Hidratar campos con [data-k] y persistir al editar */
    document.querySelectorAll("[data-k]").forEach(function (el) {
      var key = el.getAttribute("data-k");
      if (el.type === "checkbox") {
        if (data[key] === true) el.checked = true;
        el.addEventListener("change", function () { set(key, el.checked); });
      } else if (el.type === "radio") {
        if (data[key] === el.value) el.checked = true;
        el.addEventListener("change", function () { if (el.checked) set(key, el.value); });
      } else {
        if (data[key] != null) el.value = data[key];
        el.addEventListener("input", function () { set(key, el.value); });
        el.addEventListener("change", function () { set(key, el.value); });
      }
    });

    /* Contadores de caracteres: textarea[data-counter="idDelContador"] */
    document.querySelectorAll("[data-counter]").forEach(function (ta) {
      var counter = document.getElementById(ta.getAttribute("data-counter"));
      var max = parseInt(ta.getAttribute("maxlength") || "4000", 10);
      function upd() {
        if (counter) counter.textContent = (max - ta.value.length) + " caracteres restantes";
      }
      ta.addEventListener("input", upd);
      upd();
    });

    /* Grupos de toggle: contenedor [data-toggle-group="claveAlmacen"]
       con botones [data-toggle-val="valor"] */
    document.querySelectorAll("[data-toggle-group]").forEach(function (group) {
      var key = group.getAttribute("data-toggle-group");
      var btns = group.querySelectorAll("[data-toggle-val]");
      var current = data[key] || group.getAttribute("data-default");

      function activate(val, silent) {
        set(key, val);
        btns.forEach(function (b) {
          var on = b.getAttribute("data-toggle-val") === val;
          b.classList.toggle("active-selection", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        if (!silent) document.dispatchEvent(new CustomEvent("toggle:" + key, { detail: val }));
      }
      btns.forEach(function (b) {
        b.addEventListener("click", function () { activate(b.getAttribute("data-toggle-val")); });
      });
      if (current) activate(current, true);
    });

    /* Reaccionar al tipo de reclamado: cambiar etiqueta DNI/RUC */
    document.addEventListener("toggle:reclamadoTipo", function (e) {
      var esEmpresa = e.detail !== "persona";
      var label = document.getElementById("docReclLabel");
      var hint = document.getElementById("docReclHint");
      var input = document.getElementById("docReclInput");
      if (label) label.innerHTML = (esEmpresa ? "RUC de la empresa" : "DNI de la persona") + ' <span class="text-primary">*</span>';
      if (hint) hint.textContent = esEmpresa ? "Búscalo en tu boleta o factura de compra." : "El número de DNI de la persona natural.";
      if (input) input.placeholder = esEmpresa ? "Ingresa el RUC (11 dígitos)" : "Ingresa el DNI (8 dígitos)";
    });

    /* Tooltips de términos técnicos */
    initTooltips();

    /* Pantalla de éxito: mostrar nº de expediente, poblar comprobante y confeti */
    var expEl = document.getElementById("expediente");
    if (expEl) {
      expEl.textContent = data.expediente || "RC-2026-00000";
      poblarComprobante();
      lanzarConfeti();
    }

    /* Mostrar modal tutorial solo en landing y solo la primera vez */
    var modal = document.getElementById("modal-overlay");
    if (modal && !localStorage.getItem("tutorialVisto")) {
      modal.style.display = "flex";
    }
  });

  /* ---------- Confeti ---------- */
  function lanzarConfeti() {
    var colors = ["#c40043", "#001e40", "#ff8934"];
    for (var i = 0; i < 28; i++) {
      var c = document.createElement("div");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.top = "-10px";
      c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      c.style.transform = "rotate(" + Math.random() * 360 + "deg)";
      document.body.appendChild(c);
      (function (node) {
        var anim = node.animate(
          [{ top: "-10px", opacity: 1 }, { top: "100vh", opacity: 0 }],
          { duration: 2200 + Math.random() * 3000, easing: "cubic-bezier(0,0,0.2,1)" }
        );
        anim.onfinish = function () { node.remove(); };
      })(c);
    }
  }
})();
