/* Speranza Impianti: menu, consenso cookie, mappa su consenso, modulo preventivo */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  var CONSENT_KEY = "si-consenso-v1";
  var CONSENT_DAYS = 180; // il consenso si richiede di nuovo dopo 6 mesi (linee guida Garante 2021)
  var MAP_SRC = "https://www.google.com/maps?q=Piazza+Mariano+D%27Ayala+11,+67100+L%27Aquila&z=16&output=embed";
  var MAIL_TO = "speranzaimpianti@gmail.com";

  /* ---------- stato del consenso ---------- */
  function readConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      if (!c || !c.t || Date.now() - c.t > CONSENT_DAYS * 864e5) return null;
      return c;
    } catch (e) { return null; }
  }
  function saveConsent(maps) {
    var c = { maps: !!maps, t: Date.now(), v: 1 };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); } catch (e) { /* archiviazione non disponibile */ }
    return c;
  }

  /* ---------- mappa ---------- */
  function loadMap() {
    var box = document.getElementById("mappa");
    if (!box || box.querySelector("iframe")) return;
    var f = document.createElement("iframe");
    f.src = MAP_SRC;
    f.title = "Mappa: Speranza Impianti, Piazza Mariano D'Ayala 11, L'Aquila";
    f.referrerPolicy = "no-referrer-when-downgrade";
    box.innerHTML = "";
    box.appendChild(f);
  }
  function resetMap() {
    var box = document.getElementById("mappa");
    if (box && box.querySelector("iframe")) window.location.reload();
  }

  /* ---------- banner ---------- */
  var banner = document.getElementById("cookie-banner");
  var prefs = document.getElementById("cookie-prefs");
  var mapsToggle = document.getElementById("pref-maps");

  function openBanner(showPrefs) {
    if (!banner) return;
    var c = readConsent();
    if (mapsToggle) mapsToggle.checked = !!(c && c.maps);
    if (prefs) prefs.hidden = !showPrefs;
    banner.hidden = false;
    var custom = banner.querySelector('[data-cookie="customize"]');
    if (custom) custom.textContent = showPrefs ? "Salva le scelte" : "Personalizza";
  }
  function closeBanner() { if (banner) banner.hidden = true; }

  function apply(c) {
    if (c && c.maps) loadMap(); else resetMap();
  }

  if (banner) {
    banner.addEventListener("click", function (e) {
      var b = e.target.closest("[data-cookie]");
      if (!b) return;
      var a = b.getAttribute("data-cookie");
      if (a === "accept") { apply(saveConsent(true)); closeBanner(); }
      else if (a === "reject") { apply(saveConsent(false)); closeBanner(); }
      else if (a === "customize") {
        if (prefs && !prefs.hidden) { apply(saveConsent(mapsToggle && mapsToggle.checked)); closeBanner(); }
        else openBanner(true);
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !banner.hidden) { apply(saveConsent(false)); closeBanner(); }
    });
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-cookie-prefs]")) { e.preventDefault(); openBanner(true); }
    if (e.target.closest("[data-load-map]")) {
      // il clic sul pulsante vale come consenso specifico per la mappa
      var c = readConsent();
      saveConsent(true);
      loadMap();
      if (!c) closeBanner();
    }
  });

  var current = readConsent();
  if (current) apply(current); else openBanner(false);

  /* ---------- menu mobile ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("menu");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- anni di attività e anno corrente ---------- */
  var y = new Date().getFullYear();
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = y; });
  document.querySelectorAll("[data-anni]").forEach(function (el) { el.textContent = (y - 2004) + ""; });

  /* ---------- comparsa morbida ---------- */
  var els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- modulo preventivo: prepara un'email, nessun invio a server ---------- */
  var form = document.getElementById("preventivo");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.querySelector(".form-msg");
      var get = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
      var missing = [];
      if (!get("f-nome")) missing.push("nome");
      if (!get("f-tel")) missing.push("telefono");
      if (!get("f-msg")) missing.push("descrizione");
      if (!document.getElementById("f-privacy").checked) missing.push("consenso privacy");
      if (missing.length) {
        msg.textContent = "Completate i campi obbligatori: " + missing.join(", ") + ".";
        msg.classList.add("err");
        return;
      }
      msg.classList.remove("err");
      var body =
        "Nome: " + get("f-nome") + "\n" +
        "Telefono: " + get("f-tel") + "\n" +
        "Email: " + (get("f-email") || "-") + "\n" +
        "Località: " + (get("f-luogo") || "-") + "\n" +
        "Richiesta: " + get("f-tipo") + "\n\n" +
        get("f-msg") + "\n\n" +
        "Ho letto l'informativa privacy e acconsento al trattamento dei dati per ricevere il preventivo.";
      var subject = "Richiesta preventivo: " + get("f-tipo");
      window.location.href = "mailto:" + MAIL_TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      msg.textContent = "Si è aperto il vostro programma di posta con la richiesta già compilata. Se non si apre, scriveteci a " + MAIL_TO + " o chiamate il 335 842 5599.";
    });
  }
})();
