/* swaga // spinning world globe — drop-in add-on. Include AFTER the main script:
   <script src="globe.js"></script>  (just before </body>) */
(function () {
  const MASK = [
    "................................................",
    "..........####.#####............................",
    "...###########.######...........################",
    "...###############......#####...................".slice(0, 29) + "###################",
    "....################...##.######################",
    "....###############....#########################",
    ".....##############.....########################",
    ".....#############....##########################",
    "......##########......################..#######.",
    ".......######.........##############...########.",
    "..........###.........################..#.. ###..".replace(/ /g, "."),
    "..............#####.....############.....#####..",
    "..............########..############.....######.",
    "..............########...###########.......#####",
    "..............########...###########.....######.",
    "..............#######....##########....#######..",
    "..............######......########.....########.",
    "..............#####....................#####.#.#".slice(0, 41) + "#####.##",
    "..............####............................##".slice(0, 46) + "##",
    "...............##...............................",
    "................................................",
    "################################################",
    "################################################",
    "################################################"
  ].map(r => (r + ".".repeat(48)).slice(0, 48));

  const CITIES = [[40.7,-74],[34,-118],[19.4,-99],[-23.5,-46.6],[51.5,-0.1],[48.9,2.3],[30,31],[-26,28],[6.5,3.4],[55.7,37.6],[28.6,77.2],[39.9,116.4],[35.7,139.7],[1.35,103.8],[-33.9,151.2],[-36.8,174.8],[37.8,-122.4],[-34.6,-58.4],[59.3,18],[25.2,55.3]];
  const rad = Math.PI / 180;
  const isLand = (lat, lon) => {
    const c = Math.min(47, Math.max(0, Math.floor((lon + 180) / 7.5)));
    const r = Math.min(23, Math.max(0, Math.floor((90 - lat) / 7.5)));
    return MASK[r][c] === "#";
  };
  const vec = (lat, lon) => [Math.cos(lat * rad) * Math.sin(lon * rad), Math.sin(lat * rad), Math.cos(lat * rad) * Math.cos(lon * rad)];

  // land dots (fibonacci sphere)
  const DOTS = [];
  const N = 4200;
  for (let i = 0; i < N; i++) {
    const y = 1 - 2 * (i + 0.5) / N, lat = Math.asin(y) / rad, lon = ((i * 137.508) % 360) - 180;
    if (isLand(lat, lon)) DOTS.push(vec(lat, lon));
  }

  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  let nodes = {};
  function refreshNodes() {
    let users = {};
    try { users = JSON.parse(localStorage.getItem("nx_users")) || {}; } catch (e) {}
    nodes = {};
    Object.keys(users).forEach(u => {
      const h = hash(u), c = CITIES[h % CITIES.length];
      nodes[u] = [c[0] + ((h >> 8) % 60 - 30) / 10, c[1] + ((h >> 16) % 60 - 30) / 10];
    });
  }
  const me = () => (typeof CU !== "undefined" && CU) ? CU : null;
  const rndCity = () => CITIES[Math.random() * CITIES.length | 0];

  // events
  const arcs = [];
  const feed = [];
  const COL = { cyan: "0,229,255", amber: "255,196,0", green: "0,230,118", pink: "255,77,172", teal: "0,191,165", purple: "180,74,255", blue: "68,138,255" };
  function addArc(a, b, col) { arcs.push({ a, b, col, t0: performance.now(), dur: 2000 }); if (arcs.length > 40) arcs.shift(); }
  function pushEvent(msg) {
    if (!msg || msg[0] === "⚠") return;
    const col = /Quest|⚔/.test(msg) ? "amber" : /XP|Session/.test(msg) ? "green" : /Posted/.test(msg) ? "pink" : /Habit|streak|🔥/.test(msg) ? "teal" : /Unlocked|🏆/.test(msg) ? "purple" : /Skill/.test(msg) ? "blue" : "cyan";
    refreshNodes();
    const u = me(), from = (u && nodes[u]) || rndCity();
    const others = Object.keys(nodes).filter(n => n !== u);
    const to = others.length ? nodes[others[Math.random() * others.length | 0]] : rndCity();
    addArc(from, to, col);
    feed.unshift({ u: u || "agent", msg: msg.replace(/^[^\w+]+/, ""), col });
    if (feed.length > 3) feed.pop();
    globes.forEach(g => g.renderFeed());
  }
  // hook the app's notification function
  const orig = window.showNotif;
  window.showNotif = function (m) { if (orig) orig.apply(this, arguments); try { pushEvent(m); } catch (e) {} };
  // ambient traffic
  setInterval(() => {
    if (document.hidden) return;
    refreshNodes();
    const keys = Object.keys(nodes);
    const pick = () => (keys.length && Math.random() < 0.5) ? nodes[keys[Math.random() * keys.length | 0]] : rndCity();
    const cols = ["cyan", "purple", "blue", "teal"];
    addArc(pick(), pick(), cols[Math.random() * cols.length | 0]);
  }, 2400);

  // styles
  const st = document.createElement("style");
  st.textContent = ".nx-g-box{position:relative;width:100%}.nx-g-box canvas{display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab}.nx-g-feed{font-size:10px;letter-spacing:1px;color:var(--text2);min-height:40px;margin-top:6px;line-height:1.7}.nx-g-feed b{font-weight:normal}.nx-globe.nx-full{position:fixed!important;inset:0;z-index:5000;margin:0!important;max-width:none!important;width:100%!important;border-radius:0;background:#0a0a0f;display:flex;flex-direction:column;padding:14px 14px 22px}.nx-full .nx-g-box{flex:1;height:auto!important;min-height:0}.nx-full .nx-g-feed{font-size:12px;min-height:64px}.nx-g-bar{display:flex;align-items:center;gap:7px;margin-top:6px}.nx-g-trk{font-size:10px;color:var(--cyan);letter-spacing:1px;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}";
  document.head.appendChild(st);

  // ── MUSIC ── generative jazz (original, synthesized live) or your own tracks via
  // window.NX_TRACKS = [{name:"Dobbe & Aude — Title", src:"audio/title.mp3"}]  (set before globe.js loads)
  const music = (function () {
    let ac = null, master, noiseBuf, timer = null, playing = false, nextT = 0, bar = 0, mel = 72, idx = 0, audio = null;
    const BPM = 104, beat = 60 / BPM, sw = beat * 2 / 3;
    const CH = [[2,"m7"],[7,"7"],[0,"maj7"],[9,"7"],[2,"m7"],[7,"7"],[0,"maj7"],[7,"7"]];
    const TY = { m7: [0,3,7,10], "7": [0,4,7,10], maj7: [0,4,7,11] };
    const VO = { m7: [3,10,14], "7": [4,10,14], maj7: [4,11,14] };
    const TR = () => window.NX_TRACKS || [];
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
    const pick = a => a[Math.random() * a.length | 0];

    function init() {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0.55;
      const comp = ac.createDynamicsCompressor(), dly = ac.createDelay(), fb = ac.createGain(), lp = ac.createBiquadFilter(), wet = ac.createGain();
      dly.delayTime.value = beat * 0.75; fb.gain.value = 0.28; lp.type = "lowpass"; lp.frequency.value = 2600; wet.gain.value = 0.3;
      master.connect(comp); master.connect(dly); dly.connect(lp); lp.connect(fb); fb.connect(dly); lp.connect(wet); wet.connect(comp); comp.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    function tone(type, f, t, dur, vol, att, lpf) {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      if (lpf) { const l = ac.createBiquadFilter(); l.type = "lowpass"; l.frequency.value = lpf; o.connect(l); l.connect(g); } else o.connect(g);
      g.connect(master); o.start(t); o.stop(t + dur + 0.05);
    }
    function noise(t, dur, vol, type, freq, q) {
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    }
    const bass = (m, t) => tone("triangle", mtof(m), t, beat * 0.92, 0.5, 0.01, 520);
    const keys = (m, t, d, v) => { tone("sine", mtof(m), t, d, v, 0.008); tone("sine", mtof(m) * 2, t, d * 0.5, v * 0.25, 0.004); };
    const vib = (m, t, d) => { tone("sine", mtof(m), t, d, 0.17, 0.003); tone("sine", mtof(m) * 4, t, 0.18, 0.035, 0.002); };
    const eighth = (t0, j) => t0 + Math.floor(j / 2) * beat + (j % 2 ? sw : 0);

    function scheduleBar(t0) {
      const c = CH[bar % 8], nx = CH[(bar + 1) % 8], ty = c[1], tones = TY[ty], rootB = 36 + c[0];
      // walking bass
      bass(rootB, t0);
      bass(rootB + pick([tones[1], tones[2]]), t0 + beat);
      bass(rootB + pick([tones[2], tones[3]]), t0 + beat * 2);
      bass(36 + nx[0] + pick([-1, 1]), t0 + beat * 3);
      // comping
      const vo = VO[ty].map(i => 48 + c[0] + i);
      vo.forEach(m => keys(m, t0, beat * 1.6, 0.07));
      if (Math.random() < 0.7) vo.forEach(m => keys(m, t0 + beat + sw, beat * 0.6, 0.06));
      if (Math.random() < 0.4) vo.forEach(m => keys(m, t0 + beat * 3 + sw, beat * 0.6, 0.055));
      // drums: swing ride, hat on 2 & 4, feathered kick, ghost snare
      for (let i = 0; i < 4; i++) noise(t0 + i * beat, 0.35, 0.05, "bandpass", 7500, 1.5);
      [1, 3].forEach(i => { noise(t0 + i * beat + sw, 0.25, 0.035, "bandpass", 7500, 1.5); noise(t0 + i * beat, 0.06, 0.07, "highpass", 5000, 0.7); });
      if (Math.random() < 0.6) tone("sine", 60, t0, 0.14, 0.12, 0.004);
      if (Math.random() < 0.25) noise(t0 + eighthOff(), 0.1, 0.05, "bandpass", 1800, 0.8);
      // melody (vibes)
      if (Math.random() < 0.75) {
        const pool = [0, tones[1], tones[2], tones[3], 14].map(i => 60 + c[0] + i);
        const cand = []; pool.forEach(m => [0, 12].forEach(o => { const x = m + o; if (x >= 64 && x <= 86) cand.push(x); }));
        let j = pick([0, 1, 2, 3, 4]), n = 3 + (Math.random() * 3 | 0);
        for (let k = 0; k < n && j <= 7; k++) {
          const m = cand.map(x => [x, Math.abs(x - mel) + Math.random() * 4]).sort((a, b) => a[1] - b[1])[0][0];
          mel = m; vib(m, eighth(t0, j), beat * 0.9);
          j += 1 + (Math.random() < 0.3 ? 1 : 0);
        }
      }
    }
    function eighthOff() { return beat * (1 + Math.random() * 2.5); }
    function tick() { while (ac && nextT < ac.currentTime + 0.5) { scheduleBar(nextT); nextT += beat * 4; bar++; } }
    function startGen() { if (!ac) init(); ac.resume(); nextT = ac.currentTime + 0.15; bar = 0; timer = setInterval(tick, 50); tick(); }
    function stopGen() { clearInterval(timer); timer = null; if (ac) { ac.close().catch(() => {}); ac = null; } }
    function playTrack(i) {
      const L = TR(); idx = (i + L.length) % L.length;
      if (!audio) { audio = new Audio(); audio.onended = () => playTrack(idx + 1); }
      audio.src = L[idx].src; audio.play().catch(() => {}); ui();
    }
    function ui() {
      const L = TR();
      globes.forEach(g => {
        g.pp.textContent = playing ? "❚❚ Pause" : "♪ Play jazz";
        g.nx.style.display = L.length ? "" : "none";
        g.trk.textContent = playing ? (L.length ? L[idx].name : "Nexus Lounge · generated live") : "";
      });
    }
    return {
      toggle() {
        if (playing) { playing = false; stopGen(); if (audio) audio.pause(); }
        else { playing = true; if (TR().length) playTrack(idx); else startGen(); }
        ui();
      },
      next() { if (playing && TR().length) playTrack(idx + 1); }
    };
  })();

  // globe instances
  const globes = [];
  function mount(parent, before, height, extraStyle) {
    const wrap = document.createElement("div");
    wrap.className = "card card-cyan nx-globe";
    if (extraStyle) wrap.style.cssText = extraStyle;
    wrap.innerHTML = '<div class="card-title" style="margin-bottom:6px;display:flex;align-items:center;gap:8px">World Feed <span class="badge badge-cyan" style="font-size:9px">Live</span><button class="btn btn-ghost btn-xs nx-fs" style="margin-left:auto">⛶ Full</button></div><div class="nx-g-box" style="height:' + height + 'px"><canvas></canvas></div><div class="nx-g-bar"><button class="btn btn-purple btn-xs nx-pp">♪ Play jazz</button><button class="btn btn-ghost btn-xs nx-nx" style="display:none">⏭</button><span class="nx-g-trk"></span></div><div class="nx-g-feed"></div>';
    parent.insertBefore(wrap, before || null);
    const box = wrap.querySelector(".nx-g-box"), cv = wrap.querySelector("canvas"), ctx = cv.getContext("2d"), fe = wrap.querySelector(".nx-g-feed");
    const g = { cv, ctx, box, yaw: 0, tilt: 0.38, drag: false, lx: 0, vel: 0.004,
      renderFeed() { fe.innerHTML = feed.length ? feed.map(f => '<div style="color:rgb(' + COL[f.col] + ')">▸ <b>' + esc(f.u) + '</b> · ' + esc(f.msg) + "</div>").join("") : "<div>Waiting for signals… do something in the app.</div>"; } };
    const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    cv.addEventListener("pointerdown", e => { g.drag = true; g.lx = e.clientX; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing"; });
    cv.addEventListener("pointermove", e => { if (!g.drag) return; const dx = e.clientX - g.lx; g.lx = e.clientX; g.yaw -= dx * 0.008; g.vel = -dx * 0.0008; });
    const end = () => { g.drag = false; cv.style.cursor = "grab"; };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    g.renderFeed();
    g.pp = wrap.querySelector(".nx-pp"); g.nx = wrap.querySelector(".nx-nx"); g.trk = wrap.querySelector(".nx-g-trk");
    g.pp.onclick = music.toggle; g.nx.onclick = music.next;
    const fsb = wrap.querySelector(".nx-fs"), ph = document.createComment("globe"); g.full = false;
    g.toggleFull = function (force) {
      const want = typeof force === "boolean" ? force : !g.full;
      if (want === g.full) return; g.full = want;
      if (want) { wrap.parentNode.insertBefore(ph, wrap); document.body.appendChild(wrap); wrap.classList.add("nx-full"); fsb.textContent = "✕ Close"; if (wrap.requestFullscreen) wrap.requestFullscreen().catch(() => {}); }
      else { wrap.classList.remove("nx-full"); fsb.textContent = "⛶ Full"; if (ph.parentNode) { ph.parentNode.insertBefore(wrap, ph); ph.remove(); } if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }
    };
    fsb.onclick = () => g.toggleFull();
    globes.push(g);
    return g;
  }
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement) globes.forEach(g => g.full && g.toggleFull(false)); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") globes.forEach(g => g.full && g.toggleFull(false)); });

  function project(g, v, R, cx, cy) {
    const cy_ = Math.cos(g.yaw), sy = Math.sin(g.yaw), ct = Math.cos(g.tilt), stl = Math.sin(g.tilt);
    const x = v[0] * cy_ + v[2] * sy, z = v[2] * cy_ - v[0] * sy;
    const y2 = v[1] * ct - z * stl, z2 = v[1] * stl + z * ct;
    return { x: cx + R * x, y: cy - R * y2, z: z2, vx: x, vy: y2 };
  }

  function slerpPt(A, B, om, t, lift) {
    const s = Math.sin(om), a = Math.sin((1 - t) * om) / s, b = Math.sin(t * om) / s;
    const k = 1 + lift * Math.sin(Math.PI * t);
    return [(a * A[0] + b * B[0]) * k, (a * A[1] + b * B[1]) * k, (a * A[2] + b * B[2]) * k];
  }

  function draw(g, now) {
    const cv = g.cv, dpr = window.devicePixelRatio || 1, w = g.box.clientWidth, h = g.box.clientHeight;
    if (cv.width !== w * dpr || cv.height !== h * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    const ctx = g.ctx; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const R = Math.min(w, h) / 2 * 0.9, cx = w / 2, cy = h / 2;
    if (!g.drag) { g.yaw += g.vel; g.vel += (0.004 - g.vel) * 0.02; }
    // sphere
    const gr = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
    gr.addColorStop(0, "rgba(0,229,255,.10)"); gr.addColorStop(1, "rgba(10,10,15,.6)");
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fillStyle = gr; ctx.fill();
    ctx.save(); ctx.shadowColor = "#00e5ff"; ctx.shadowBlur = 14; ctx.strokeStyle = "rgba(0,229,255,.45)"; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    // dots
    ctx.fillStyle = "#00e5ff";
    for (let i = 0; i < DOTS.length; i++) {
      const p = project(g, DOTS[i], R, cx, cy);
      ctx.globalAlpha = p.z > 0 ? 0.3 + 0.55 * p.z : 0.05;
      ctx.fillRect(p.x - 0.8, p.y - 0.8, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
    // arcs
    for (let i = arcs.length - 1; i >= 0; i--) {
      const a = arcs[i], p = (now - a.t0) / a.dur;
      if (p > 1.8) { arcs.splice(i, 1); continue; }
      const A = vec(a.a[0], a.a[1]), B = vec(a.b[0], a.b[1]);
      const dot = Math.max(-1, Math.min(1, A[0] * B[0] + A[1] * B[1] + A[2] * B[2])), om = Math.acos(dot);
      if (om < 0.05) continue;
      const head = Math.min(1, p), tail = Math.max(0, head - 0.55) + (p > 1 ? Math.min(1, (p - 1) / 0.8) * 0.45 : 0);
      const lift = 0.1 + om / Math.PI * 0.45, steps = 26;
      let prev = null;
      for (let s = 0; s <= steps; s++) {
        const t = tail + (head - tail) * s / steps;
        const q = project(g, slerpPt(A, B, om, t, lift), R, cx, cy);
        const hidden = q.z < 0 && q.vx * q.vx + q.vy * q.vy < 1;
        if (prev && !hidden && !prev.hidden) {
          ctx.strokeStyle = "rgba(" + COL[a.col] + "," + (0.15 + 0.85 * s / steps) + ")"; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
        prev = { x: q.x, y: q.y, hidden };
      }
      if (p < 1 && prev && !prev.hidden) { ctx.fillStyle = "rgb(" + COL[a.col] + ")"; ctx.beginPath(); ctx.arc(prev.x, prev.y, 2.4, 0, 7); ctx.fill(); }
      if (p > 0.95) {
        const q = project(g, B, R, cx, cy);
        if (q.z > 0) { const rp = Math.min(1, (p - 0.95) / 0.8); ctx.strokeStyle = "rgba(" + COL[a.col] + "," + (1 - rp) + ")"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q.x, q.y, 3 + rp * 14, 0, 7); ctx.stroke(); }
      }
    }
    // user nodes
    const u = me();
    ctx.font = "9px 'Courier New',monospace"; ctx.textAlign = "left";
    Object.keys(nodes).forEach(name => {
      const q = project(g, vec(nodes[name][0], nodes[name][1]), R, cx, cy);
      if (q.z <= 0.05) return;
      const mine = name === u;
      ctx.fillStyle = mine ? "#ffc400" : "#b44aff";
      ctx.beginPath(); ctx.arc(q.x, q.y, mine ? 3.4 : 2.6, 0, 7); ctx.fill();
      if (mine) { const r = (now % 1600) / 1600; ctx.strokeStyle = "rgba(255,196,0," + (1 - r) + ")"; ctx.beginPath(); ctx.arc(q.x, q.y, 4 + r * 10, 0, 7); ctx.stroke(); }
      ctx.fillStyle = mine ? "#ffc400" : "rgba(224,224,240,.75)"; ctx.fillText(name, q.x + 6, q.y + 3);
    });
  }

  function loop(now) {
    globes.forEach(g => { if (g.cv.offsetParent !== null) draw(g, now); });
    requestAnimationFrame(loop);
  }

  function init() {
    refreshNodes();
    // 1) login/register screen: under the form
    const login = document.querySelector("#login-screen");
    if (login) mount(login, null, 210, "width:100%;max-width:360px;margin-top:26px");
    // 2) profile screen: first thing after login, above the profile header
    const pc = document.querySelector("#screen-profile .content"), bonus = document.getElementById("daily-bonus-wrap");
    let pg = null;
    if (pc) { pg = mount(pc, bonus ? bonus.nextSibling : pc.firstChild, 250); pg.isProfile = true; }
    // 3) nav shortcut: opens the world full screen
    const nav = document.querySelector("nav");
    if (nav && pg) {
      const b = document.createElement("button");
      b.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 010 20a15 15 0 010-20z"/></svg>World';
      b.onclick = () => pg.toggleFull(true);
      nav.insertBefore(b, nav.children[1] || null);
    }
    requestAnimationFrame(loop);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
