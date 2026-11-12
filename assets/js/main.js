/* Speranza Impianti: tubi che si riempiono, servizi a schede, prima/dopo, galleria,
   preventivo guidato, consenso cookie e mappa su consenso. Nessuna libreria esterna. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CONSENT_KEY = "si-consenso-v1";
  var CONSENT_DAYS = 180; // il consenso si richiede di nuovo dopo 6 mesi (linee guida Garante 2021)
  var MAP_SRC = "https://www.google.com/maps?q=Piazza+Mariano+D%27Ayala+11,+67100+L%27Aquila&z=16&output=embed";
  var MAIL_TO = "speranzaimpianti@gmail.com";
  var PHONE = "335 842 5599";

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- ingresso della pagina ---------- */
  function start() { setTimeout(function () { document.body.classList.add("loaded"); }, 30); }
  if (document.fonts && document.fonts.ready) { Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 600); })]).then(start); }
  else start();

  /* ---------- testata compatta e dorsale: i due tubi si riempiono scorrendo ---------- */
  var header = $(".site-header");
  var main = $("main");
  var spine = $(".spine");
  var taps = $$(".tap");
  var ticking = false;
  function update() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("scrolled", y > 10);
    var line = window.innerHeight * 0.55;
    if (spine && main) {
      var r = main.getBoundingClientRect();
      var f = (line - r.top) / r.height;
      spine.style.setProperty("--fill", Math.max(0, Math.min(1, f)).toFixed(4));
    }
    taps.forEach(function (t) { t.classList.toggle("on", t.getBoundingClientRect().top < line); });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  if (spine && !reduce) {
    spine.classList.add("intro");
    setTimeout(function () { spine.classList.remove("intro"); }, 1600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  setTimeout(update, 120);

  /* ---------- servizi a schede ---------- */
  var tabs = $$(".svc-tab");
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      var p = document.getElementById(t.getAttribute("aria-controls"));
      if (!p) return;
      if (on) {
        p.hidden = false;
        p.classList.remove("entering"); void p.offsetWidth; p.classList.add("entering");
      } else p.hidden = true;
    });
    if (focus) tab.focus();
    if (window.innerWidth < 900) tab.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); });
    t.addEventListener("keydown", function (e) {
      var k = e.key, n = null;
      if (k === "ArrowDown" || k === "ArrowRight") n = tabs[(i + 1) % tabs.length];
      if (k === "ArrowUp" || k === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (k === "Home") n = tabs[0];
      if (k === "End") n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
  });

  /* ---------- prima e dopo ---------- */
  var cmp = $("#compare");
  if (cmp) {
    var range = $("input[type=range]", cmp);
    var setPos = function (v) { cmp.style.setProperty("--pos", v + "%"); };
    range.addEventListener("input", function () { setPos(range.value); });
    // un solo accenno di movimento la prima volta che il confronto entra in vista
    if (!reduce && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        io.disconnect();
        var t0 = null;
        var anim = function (ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / 1600);
          var v = 50 - Math.sin(p * Math.PI) * 18;
          if (document.activeElement !== range) { setPos(v); range.value = Math.round(v); }
          if (p < 1) requestAnimationFrame(anim);
        };
        setTimeout(function () { requestAnimationFrame(anim); }, 350);
      }, { threshold: 0.6 });
      io.observe(cmp);
    }
  }

  /* ---------- galleria con ingrandimento ---------- */
  var shots = $$(".shot");
  var lb = $("#lightbox");
  var cur = 0;
  function show(i) {
    cur = (i + shots.length) % shots.length;
    var s = shots[cur], img = $("img", lb), im = $("img", s);
    img.src = s.getAttribute("data-full");
    img.alt = im ? im.alt : "";
    $("p", lb).textContent = $("span", s) ? $("span", s).textContent : "";
  }
  if (lb && lb.showModal) {
    shots.forEach(function (s, i) { s.addEventListener("click", function () { show(i); lb.showModal(); }); });
    lb.addEventListener("click", function (e) {
      var a = e.target.getAttribute && e.target.getAttribute("data-lb");
      if (a === "close" || e.target === lb) lb.close();
      if (a === "prev") show(cur - 1);
      if (a === "next") show(cur + 1);
    });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(cur - 1);
      if (e.key === "ArrowRight") show(cur + 1);
    });
  } else {
    shots.forEach(function (s) { s.addEventListener("click", function () { window.open(s.getAttribute("data-full"), "_blank"); }); });
  }

  /* ---------- domande frequenti: apertura morbida ---------- */
  $$(".faq details").forEach(function (d) {
    var sum = $("summary", d), body = $(".answer", d);
    sum.addEventListener("click", function (e) {
      if (reduce || !body.animate) return;
      e.preventDefault();
      if (d.open) {
        var h = body.offsetHeight;
        body.animate([{ height: h + "px" }, { height: "0px" }], { duration: 260, easing: "ease-in" }).onfinish = function () { d.open = false; };
      } else {
        d.open = true;
        var h2 = body.offsetHeight;
        body.animate([{ height: "0px", opacity: 0 }, { height: h2 + "px", opacity: 1 }], { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" });
      }
    });
  });

  /* ---------- preventivo guidato ---------- */
  var wiz = $("#wizard");
  var stepN = 1;
  function val(name) { var el = $('input[name="' + name + '"]:checked', wiz); return el ? el.value : ""; }
  function txt(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function msg(t, err) { var m = $(".form-msg", wiz); m.textContent = t; m.classList.toggle("err", !!err); }
  function goStep(n) {
    stepN = n;
    $$(".wstep", wiz).forEach(function (f) { f.classList.toggle("current", +f.getAttribute("data-step") === n); });
    $$(".progress i", wiz).forEach(function (p, i) { p.classList.toggle("done", i < n); });
    $("[data-prev]", wiz).hidden = n === 1;
    wiz.classList.toggle("last", n === 3);
    msg("", false);
    if (n === 3) {
      var parts = [];
      if (val("tipo")) parts.push("<b>" + esc(val("tipo")) + "</b>");
      if (val("immobile")) parts.push(esc(val("immobile")).toLowerCase());
      if (txt("f-luogo")) parts.push("a " + esc(txt("f-luogo")));
      $("#summary").innerHTML = parts.length ? "Richiesta per " + parts.join(", ") + "." : "";
      $("#summary").hidden = !parts.length;
    }
  }
  if (wiz) {
    goStep(1);
    // scegliere il tipo di intervento porta avanti da solo
    $$(".wstep[data-step='1'] input", wiz).forEach(function (r) {
      r.addEventListener("change", function () { setTimeout(function () { goStep(2); }, reduce ? 0 : 220); });
    });
    $("[data-next]", wiz).addEventListener("click", function () {
      if (stepN === 1 && !val("tipo")) { msg("Scegliete il tipo di intervento per continuare.", true); return; }
      goStep(Math.min(3, stepN + 1));
    });
    $("[data-prev]", wiz).addEventListener("click", function () { goStep(Math.max(1, stepN - 1)); });
    wiz.addEventListener("submit", function (e) {
      e.preventDefault();
      var miss = [];
      if (!txt("f-nome")) miss.push("nome");
      if (!txt("f-tel")) miss.push("telefono");
      if (!$("#f-privacy").checked) miss.push("consenso privacy");
      if (miss.length) { msg("Completate i campi obbligatori: " + miss.join(", ") + ".", true); return; }
      var body =
        "Richiesta: " + (val("tipo") || "-") + "\n" +
        "Immobile: " + (val("immobile") || "-") + "\n" +
        "Località: " + (txt("f-luogo") || "-") + "\n" +
        "Tempi: " + (val("tempi") || "-") + "\n\n" +
        "Nome: " + txt("f-nome") + "\n" +
        "Telefono: " + txt("f-tel") + "\n" +
        "Email: " + (txt("f-email") || "-") + "\n\n" +
        (txt("f-msg") ? txt("f-msg") + "\n\n" : "") +
        "Ho letto l'informativa privacy e acconsento al trattamento dei dati per ricevere il preventivo.";
      var subject = "Richiesta preventivo: " + (val("tipo") || "impianti");
      window.location.href = "mailto:" + MAIL_TO + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      msg("Si è aperto il vostro programma di posta con la richiesta già compilata. Se non si apre, scriveteci a " + MAIL_TO + " o chiamate il " + PHONE + ".", false);
    });
  }
  // i pulsanti dei servizi preselezionano la richiesta
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-service]");
    if (!b || !wiz) return;
    var v = b.getAttribute("data-service");
    var r = $$('input[name="tipo"]', wiz).filter(function (x) { return x.value === v; })[0];
    if (r) { r.checked = true; goStep(2); }
  });

  /* ---------- consenso cookie e mappa ---------- */
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
  function apply(c) { if (c && c.maps) loadMap(); else resetMap(); }
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
      var c = readConsent(); // il clic sul pulsante vale come consenso specifico per la mappa
      saveConsent(true); loadMap();
      if (!c) closeBanner();
    }
  });
  var current = readConsent();
  if (current) apply(current); else openBanner(false);

  /* ---------- menu su telefono ---------- */
  var toggle = $(".nav-toggle"), nav = $("#menu");
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

  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
