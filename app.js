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
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

  // ---- Repeating events ----
  var DAY_KEYS = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  var WEEK_KEYS = { first: 1, second: 2, third: 3, fourth: 4, last: -1 };
  var ORD = ["", "First", "Second", "Third", "Fourth"];
  function dayNum(s) { return DAY_KEYS[String(s || "").slice(0, 3).toLowerCase()]; }
  function weekdays(i) { var a = Array.isArray(i.day) ? i.day : (i.day ? [i.day] : []); return a.map(dayNum).filter(function (x) { return x != null; }); }
  function mondayOf(d) { var x = startOfDay(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function joinDays(ns) { var names = ns.slice().sort(function (a, b) { return ((a + 6) % 7) - ((b + 6) % 7); }).map(function (n) { return DAYS_L[n]; }); return names.length < 2 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1]; }
  // Has today's occurrence already happened? (1 hour after its start time)
  function finishedToday(i, d, now) {
    if (ymd(d) !== ymd(now)) return false;
    var t = String(i.time || "").trim().match(/^(\d{1,2})[:.](\d{2})/); if (!t) return false;
    return now.getTime() > new Date(d.getFullYear(), d.getMonth(), d.getDate(), +t[1], +t[2]).getTime() + 60 * 60 * 1000;
  }
  function ordinal(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function nthWeekday(y, m, wd, nth) {
    if (nth === -1) { var last = new Date(y, m + 1, 0); return new Date(y, m, last.getDate() - ((last.getDay() - wd + 7) % 7)); }
    var first = new Date(y, m, 1), d = 1 + ((wd - first.getDay() + 7) % 7) + (nth - 1) * 7;
    return d <= new Date(y, m + 1, 0).getDate() ? new Date(y, m, d) : null;
  }
  // Candidate dates in month (y, m) for a monthly rule
  function monthlyDate(i, y, m) {
    if (i.dayOfMonth) { var dim = new Date(y, m + 1, 0).getDate(); return new Date(y, m, Math.min(+i.dayOfMonth, dim)); }
    var wd = dayNum(i.day), nth = WEEK_KEYS[String(i.week || "first").toLowerCase()];
    if (wd == null || nth == null) return null;
    return nthWeekday(y, m, wd, nth);
  }
  function nextOccurrence(i, from) {
    var start = parseD(i.date), end = parseD(i.until), skip = Array.isArray(i.skip) ? i.skip : [];
    var after = start && start > from ? start : from, every = Math.max(1, +i.every || 1), d, n;
    function ok(x) { return x && x >= after && (!end || x <= end) && skip.indexOf(ymd(x)) === -1; }
    if (i.repeat === "weekly") {
      var wds = weekdays(i); if (!wds.length && start) wds = [start.getDay()]; if (!wds.length) return null;
      for (n = 0; n < 400; n++) {
        d = new Date(after.getFullYear(), after.getMonth(), after.getDate() + n);
        if (wds.indexOf(d.getDay()) === -1) continue;
        if (every > 1 && start) { var weeks = Math.floor((mondayOf(d) - mondayOf(start)) / 6048e5 + 0.5); if (weeks % every !== 0) continue; }
        if (ok(d)) return d;
      }
      return null;
    }
    if (i.repeat === "monthly") {
      for (n = 0; n < 36; n++) {
        var y = after.getFullYear(), m = after.getMonth() + n; d = monthlyDate(i, y + Math.floor(m / 12), m % 12);
        if (d && every > 1 && start) { var months = (d.getFullYear() - start.getFullYear()) * 12 + d.getMonth() - start.getMonth(); if (months % every !== 0) continue; }
        if (ok(d)) return d;
      }
      return null;
    }
    return null;
  }
  function repeatLabel(i) {
    var every = Math.max(1, +i.every || 1);
    if (i.repeat === "weekly") {
      var wds = weekdays(i); if (!wds.length) { var s = parseD(i.date); if (s) wds = [s.getDay()]; }
      var name = wds.length ? joinDays(wds) : "week";
      return every === 1 ? "Every " + name : every === 2 ? "Every other " + name : "Every " + every + " weeks";
    }
    if (i.repeat === "monthly") {
      var base = i.dayOfMonth ? "The " + ordinal(+i.dayOfMonth) : (String(i.week || "first").toLowerCase() === "last" ? "Last" : ORD[WEEK_KEYS[String(i.week || "first").toLowerCase()]] || "First") + " " + (DAYS_L[dayNum(i.day)] || "");
      return base + (every === 1 ? " of the month" : " every " + every + " months");
    }
    return "";
  }

  // Turn items.json into what's on screen today: past events removed, repeating events given their next date
  function upcoming() {
    var now = new Date(), today = startOfDay(now), out = [];
    items().forEach(function (raw) {
      if (!raw || !raw.title) return;
      var i = {}; for (var key in raw) i[key] = typeof raw[key] === "string" ? raw[key].trim() : raw[key];
      if (i.repeat) { i.repeat = String(i.repeat).toLowerCase(); i.type = "event"; }
      var until = parseD(i.showUntil); if (until && until < today) return;
      if (i.type !== "event") { out.push(i); return; }
      if (i.repeat) {
        var nx = nextOccurrence(i, today);
        if (nx && finishedToday(i, nx, now)) nx = nextOccurrence(i, new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1));
        if (!nx) return;
        var copy = {}; for (var k in i) copy[k] = i[k];
        copy.date = ymd(nx); copy.repeatText = repeatLabel(i); out.push(copy); return;
      }
      var d = parseD(i.date); if (!d || d >= today) out.push(i);
    });
    return out;
  }
  function eventsSorted(list) { return list.filter(function (i) { return i.type === "event" && parseD(i.date); }).sort(function (a, b) { return (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")); }); }

  // Layout
  var stage = el("section", "stage"), brand = el("div", "brand"); brand.appendChild(el("i")); var brandT = el("span"); brand.appendChild(brandT);
  var slides = el("div", "slides"), prog = el("div", "progress");
  stage.appendChild(brand); stage.appendChild(slides); stage.appendChild(prog);
  var rail = el("aside", "rail"), clock = el("div", "clock"), today = el("div", "today"), upH = el("h2", null, "Coming up"), up = el("ul", "upnext"), foot = el("div", "foot");
  [clock, today, upH, up, foot].forEach(function (x) { rail.appendChild(x); });
  app.appendChild(stage); app.appendChild(rail);
  // Background: two layers that crossfade when the picture changes
  var bgA = el("div", "bg"), bgB = el("div", "bg"), bgFront = bgA, bgUrl = null;
  document.body.insertBefore(bgB, app); document.body.insertBefore(bgA, app);
  function setBackground(url, dim) {
    var d = Math.min(0.95, Math.max(0, dim == null || dim === "" || isNaN(+dim) ? 0.6 : +dim));
    document.documentElement.style.setProperty("--dim", d);
    url = url ? String(url).trim() : "";
    document.body.classList.toggle("has-bg", !!url);
    if (url === bgUrl) return;
    bgUrl = url;
    var back = bgFront === bgA ? bgB : bgA;
    if (!url) { bgA.classList.remove("on"); bgB.classList.remove("on"); return; }
    var img = new Image();
    img.onload = function () {
      if (bgUrl !== url) return;
      back.style.backgroundImage = 'url("' + url.replace(/"/g, "%22") + '")';
      back.classList.add("on"); bgFront.classList.remove("on"); bgFront = back;
    };
    img.onerror = function () { if (bgUrl === url) { document.body.classList.remove("has-bg"); bgA.classList.remove("on"); bgB.classList.remove("on"); } };
    img.src = url;
  }

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

  function renderRail(cur, list) {
    up.innerHTML = "";
    var ev = eventsSorted(list).slice(0, 5);
    if (!ev.length) { up.appendChild(el("li", "empty", "No events planned yet.")); return; }
    ev.forEach(function (i) {
      var d = parseD(i.date), li = el("li", cur && i.title === cur.title && i.date === cur.date ? "cur" : ""), m = el("div", "mini");
      m.appendChild(el("b", null, d.getDate())); m.appendChild(el("span", null, MON[d.getMonth()]));
      var tx = el("div"); tx.style.minWidth = "0";
      tx.appendChild(el("div", "t", i.title));
      tx.appendChild(el("div", "s", [i.repeatText || DAYS[d.getDay()], i.time, i.place].filter(Boolean).join(" · ")));
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
    if (i.repeatText) k.appendChild(el("span", "repeat", i.repeatText));
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
  function preload(i) {
    if (!i) return;
    [i.image, i.background].forEach(function (u) { if (u) { var p = new Image(); p.src = u; } });
  }

  var idx = -1, timer = null;
  function show() {
    brandT.textContent = state.boardName || "Kitchen board";
    var list = upcoming();
    slides.innerHTML = ""; prog.innerHTML = "";
    clearTimeout(timer);
    if (!list.length) {
      setBackground(state.background, state.backgroundDim);
      var e = makeSlide({ type: "news", title: "Nothing on the board yet", text: "Add news and events in items.json." });
      e.classList.add("on"); slides.appendChild(e); renderRail(null, list);
      timer = setTimeout(show, 30000); return;
    }
    idx = (idx + 1) % list.length;
    var cur = list[idx], secs = Math.max(4, +state.seconds || 12);
    setBackground(cur.background || state.background, cur.background && cur.backgroundDim != null ? cur.backgroundDim : state.backgroundDim);
    var s = makeSlide(cur); slides.appendChild(s);
    requestAnimationFrame(function () { requestAnimationFrame(function () { s.classList.add("on"); }); });
    list.forEach(function (_, n) {
      var b = el("div", n < idx ? "done" : ""), sp = el("span"); b.appendChild(sp); prog.appendChild(b);
      if (n === idx) requestAnimationFrame(function () { requestAnimationFrame(function () { sp.style.transition = "width " + secs + "s linear"; sp.style.width = "100%"; }); });
    });
    renderRail(cur, list);
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