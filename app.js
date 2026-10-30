(function () {
  var REFRESH_DATA_MS = 2 * 60 * 1000;      // check items.json every 2 minutes
  var RELOAD_PAGE_MS = 6 * 60 * 60 * 1000;  // full reload every 6 hours to pick up design changes

  var FALLBACK = { boardName: "Kitchen board", seconds: 12, items: [] };
  var state = FALLBACK;

  var app = document.getElementById("app");
  var DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var DAYS_L = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var MON_L = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function parseD(s) { if (!s) return null; var p = String(s).split("-"); if (p.length !== 3) return null; return new Date(+p[0], +p[1] - 1, +p[2]); }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function isoWeek(d) { var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); var day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); var y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y) / 864e5 + 1) / 7); }
  function relDay(d) { var n = Math.round((startOfDay(d) - startOfDay(new Date())) / 864e5); if (n === 0) return "Today"; if (n === 1) return "Tomorrow"; if (n < 7) return "This " + DAYS_L[d.getDay()]; if (n < 14) return "In " + n + " days"; return "Week " + isoWeek(d); }
  function items() { return Array.isArray(state.items) ? state.items : []; }
  function upcoming() {
    var today = startOfDay(new Date());
    return items().filter(function (i) {
      if (!i || !i.title) return false;
      var until = parseD(i.showUntil); if (until && until < today) return false;
      if (i.type !== "event") return true;
      var d = parseD(i.date); return !d || d >= today;
    });
  }
  function eventsSorted() { return upcoming().filter(function (i) { return i.type === "event" && parseD(i.date); }).sort(function (a, b) { return (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")); }); }

  // Layout
  var stage = el("section", "stage"), brand = el("div", "brand"); brand.appendChild(el("i")); var brandT = el("span"); brand.appendChild(brandT);
  var slides = el("div", "slides"), prog = el("div", "progress");
  stage.appendChild(brand); stage.appendChild(slides); stage.appendChild(prog);
  var rail = el("aside", "rail"), clock = el("div", "clock"), today = el("div", "today"), upH = el("h2", null, "Coming up"), up = el("ul", "upnext"), foot = el("div", "foot");
  [clock, today, upH, up, foot].forEach(function (x) { rail.appendChild(x); });
  app.appendChild(stage); app.appendChild(rail);
  var tools = el("div", "tools"), fsBtn = el("button", null, "Full screen"); tools.appendChild(fsBtn); document.body.appendChild(tools);

  function tick() {
    var d = new Date();
    clock.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
    today.innerHTML = "";
    today.appendChild(el("b", null, DAYS_L[d.getDay()]));
    today.appendChild(document.createTextNode(" " + d.getDate() + " " + MON_L[d.getMonth()]));
    today.appendChild(el("br"));
    today.appendChild(el("span", "week", "Week " + isoWeek(d)));
  }
  tick(); setInterval(tick, 5000);

  function renderRail(cur) {
    up.innerHTML = "";
    var ev = eventsSorted().slice(0, 5);
    if (!ev.length) { up.appendChild(el("li", "empty", "No events planned yet.")); return; }
    ev.forEach(function (i) {
      var d = parseD(i.date), li = el("li", i === cur ? "cur" : ""), m = el("div", "mini");
      m.appendChild(el("b", null, d.getDate())); m.appendChild(el("span", null, MON[d.getMonth()]));
      var tx = el("div"); tx.style.minWidth = "0";
      tx.appendChild(el("div", "t", i.title));
      tx.appendChild(el("div", "s", [DAYS[d.getDay()], i.time, i.place].filter(Boolean).join(" · ")));
      li.appendChild(m); li.appendChild(tx); up.appendChild(li);
    });
  }

  if (window.qrcode && qrcode.stringToBytesFuncs) qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];
  function makeQr(url, label) {
    if (!window.qrcode) return null;
    try {
      var q = qrcode(0, "M"); q.addData(String(url)); q.make();
      var box = el("div", "qr"), code = el("div", "qrcode");
      code.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true, alt: label });
      box.appendChild(code); box.appendChild(el("span", null, label));
      return box;
    } catch (e) { return null; }
  }

  function makeSlide(i) {
    var s = el("article", "slide"), copy = el("div", "copy"), isEv = i.type === "event", d = parseD(i.date);
    s.style.setProperty("--k", isEv ? "var(--event)" : "var(--news)");
    var k = el("div", "kicker"); k.appendChild(el("span", "pill", isEv ? "Event" : "News"));
    if (isEv && d) k.appendChild(el("span", "when", relDay(d)));
    copy.appendChild(k);
    copy.appendChild(el("h1", null, i.title));
    if (i.text) copy.appendChild(el("p", null, i.text));
    var qr = i.qr ? makeQr(i.qr, i.qrLabel || "Scan to sign up") : null;
    var m = el("div", "meta");
    if (isEv && d) { var t = el("div", "datetile"); t.appendChild(el("span", null, DAYS[d.getDay()])); t.appendChild(el("b", null, d.getDate())); t.appendChild(el("span", null, MON[d.getMonth()])); m.appendChild(t); }
    if (isEv && (d || i.time || i.place)) {
      var f = el("div", "facts");
      if (i.time) f.appendChild(el("div", null, i.time));
      if (i.place) f.appendChild(el("div", null, i.place));
      if (d) f.appendChild(el("div", "dim", "Week " + isoWeek(d)));
      m.appendChild(f);
    }
    if (qr) m.appendChild(qr);
    if (m.childNodes.length) copy.appendChild(m);
    s.appendChild(copy);
    if (i.image) {
      var fig = el("figure", "figure"), img = new Image();
      img.alt = i.imageAlt || ""; img.src = i.image;
      img.onerror = function () { s.classList.remove("has-image"); fig.remove(); };
      fig.appendChild(img); s.appendChild(fig); s.classList.add("has-image");
    }
    return s;
  }

  // Load the next slide's image ahead of time so it appears with the slide
  function preload(i) { if (i && i.image) { var p = new Image(); p.src = i.image; } }

  var idx = -1, timer = null;
  function show() {
    brandT.textContent = state.boardName || "Kitchen board";
    var list = upcoming();
    slides.innerHTML = ""; prog.innerHTML = "";
    clearTimeout(timer);
    if (!list.length) {
      var e = makeSlide({ type: "news", title: "Nothing on the board yet", text: "Add news and events in items.json." });
      e.classList.add("on"); slides.appendChild(e); renderRail(null);
      timer = setTimeout(show, 30000); return;
    }
    idx = (idx + 1) % list.length;
    var cur = list[idx], secs = Math.max(4, +state.seconds || 12);
    var s = makeSlide(cur); slides.appendChild(s);
    requestAnimationFrame(function () { requestAnimationFrame(function () { s.classList.add("on"); }); });
    list.forEach(function (_, n) {
      var b = el("div", n < idx ? "done" : ""), sp = el("span"); b.appendChild(sp); prog.appendChild(b);
      if (n === idx) requestAnimationFrame(function () { requestAnimationFrame(function () { sp.style.transition = "width " + secs + "s linear"; sp.style.width = "100%"; }); });
    });
    renderRail(cur);
    preload(list[(idx + 1) % list.length]);
    timer = setTimeout(show, secs * 1000);
  }

  function load(first) {
    fetch("items.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) { state = data; foot.textContent = ""; if (first) show(); })
      .catch(function () {
        foot.textContent = "Could not load items.json. Showing the last version that loaded.";
        if (first) show();
      });
  }
  load(true);
  setInterval(function () { load(false); }, REFRESH_DATA_MS);
  setTimeout(function () { location.reload(); }, RELOAD_PAGE_MS);

  // TV niceties: hide cursor and button when idle, keep the screen awake
  var idleT;
  function wake() { document.body.classList.remove("idle"); clearTimeout(idleT); idleT = setTimeout(function () { document.body.classList.add("idle"); }, 4000); }
  ["mousemove", "keydown", "touchstart"].forEach(function (e) { window.addEventListener(e, wake, { passive: true }); });
  wake();
  fsBtn.addEventListener("click", function () {
    try { var r = document.documentElement, f = r.requestFullscreen || r.webkitRequestFullscreen; if (f) { var p = f.call(r); if (p && p.catch) p.catch(function () {}); } } catch (e) {}
  });
  try { if (navigator.wakeLock) navigator.wakeLock.request("screen").catch(function () {}); } catch (e) {}
})();
