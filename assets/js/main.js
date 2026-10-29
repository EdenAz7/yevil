/* =========================================================
   main.js — תפריט, טאבים, פילטרים, טפסי לידים, וואטסאפ צף
   כל ההגדרות (כתובת הסקריפט, וואטסאפ, רשתות) נמצאות ב-config.js
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const CFG = window.SITE_CONFIG || {};
  document.documentElement.classList.remove("no-js");

  /* ===== קישורים דינמיים מההגדרות ===== */
  const waUrl = () => {
    const n = String(CFG.WHATSAPP_NUMBER || "").replace(/\D/g, "");
    const t = encodeURIComponent(CFG.WHATSAPP_TEXT || "");
    return n ? `https://wa.me/${n}${t ? "?text=" + t : ""}` : "#";
  };
  document.querySelectorAll("[data-wa]").forEach(a => {
    a.href = waUrl(); a.target = "_blank"; a.rel = "noopener";
  });
  document.querySelectorAll("[data-phone]").forEach(a => {
    if (CFG.PHONE) a.href = "tel:" + CFG.PHONE;
    if (a.hasAttribute("data-phone-text") && CFG.PHONE_DISPLAY) a.textContent = CFG.PHONE_DISPLAY;
  });
  document.querySelectorAll("[data-social]").forEach(a => {
    const url = (CFG.SOCIAL || {})[a.dataset.social];
    if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
  });
  document.querySelectorAll("[data-waze]").forEach(a => { if (CFG.WAZE) { a.href = CFG.WAZE; a.target = "_blank"; a.rel = "noopener"; } });
  document.querySelectorAll("[data-maps]").forEach(a => { if (CFG.MAPS) { a.href = CFG.MAPS; a.target = "_blank"; a.rel = "noopener"; } });

  /* ===== ניווט פעיל ===== */
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach(a => {
    if (a.getAttribute("href") === page) a.setAttribute("aria-current", "page");
  });

  /* ===== תפריט מובייל ===== */
  const burger = document.querySelector("[data-burger]");
  const drawer = document.querySelector("[data-drawer]");
  const closeBtn = document.querySelector("[data-close]");
  const closeDrawer = () => { drawer.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); burger.focus(); };
  if (burger && drawer) {
    burger.addEventListener("click", () => { drawer.classList.add("open"); burger.setAttribute("aria-expanded", "true"); closeBtn && closeBtn.focus(); });
    closeBtn && closeBtn.addEventListener("click", closeDrawer);
    drawer.addEventListener("click", e => { if (e.target === drawer) closeDrawer(); });
    drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", () => drawer.classList.remove("open")));
    document.addEventListener("keydown", e => { if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer(); });
  }

  /* ===== טאבים ===== */
  document.querySelectorAll("[data-tabs]").forEach(box => {
    const tabs = [...box.querySelectorAll('[role="tab"]')];
    const panels = [...box.querySelectorAll('[role="tabpanel"]')];
    const counter = box.querySelector("[data-tab-current]");
    const select = i => {
      tabs.forEach((t, k) => { t.setAttribute("aria-selected", String(k === i)); t.tabIndex = k === i ? 0 : -1; });
      panels.forEach((p, k) => p.classList.toggle("active", k === i));
      if (counter) counter.textContent = String(i + 1).padStart(2, "0");
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", e => {
        // בעברית (RTL) החץ שמאלה מתקדם לטאב הבא
        let n = null;
        if (e.key === "ArrowLeft") n = (i + 1) % tabs.length;
        if (e.key === "ArrowRight") n = (i - 1 + tabs.length) % tabs.length;
        if (n !== null) { e.preventDefault(); select(n); tabs[n].focus(); }
      });
    });
    select(0);
  });

  /* ===== פילטרים בדף הדגמים ===== */
  const grid = document.getElementById("model-grid");
  if (grid) {
    const state = { type: "all", use: "all" };
    const cards = [...grid.querySelectorAll(".model")];
    const empty = document.getElementById("models-empty");
    const apply = () => {
      let shown = 0;
      cards.forEach(c => {
        const ok = (state.type === "all" || c.dataset.type === state.type) && (state.use === "all" || c.dataset.use.split(" ").includes(state.use));
        c.hidden = !ok; if (ok) shown++;
      });
      empty && empty.classList.toggle("show", shown === 0);
    };
    document.querySelectorAll("[data-filter]").forEach(btn => {
      btn.addEventListener("click", () => {
        const group = btn.dataset.group;
        state[group] = btn.dataset.filter;
        document.querySelectorAll(`[data-group="${group}"]`).forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
        apply();
      });
    });
  }

  /* ===== טפסי לידים → Google Sheets ===== */
  document.querySelectorAll("form[data-lead]").forEach(form => {
    const status = form.querySelector(".form-status");
    const btn = form.querySelector('button[type="submit"]');
    const pageField = form.querySelector('input[name="page"]');
    if (pageField) pageField.value = page;

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (!CFG.SCRIPT_URL) {
        status.className = "form-status error";
        status.textContent = "SCRIPT_URL לא הוגדר ב-config.js — הלידים לא יישמרו.";
        return;
      }
      btn.disabled = true;
      status.className = "form-status";
      status.textContent = "שולח…";
      try {
        // no-cors: ל-Apps Script אין כותרות CORS, אבל השליחה עצמה מצליחה
        await fetch(CFG.SCRIPT_URL, {
          method: "POST", mode: "no-cors",
          body: new URLSearchParams(new FormData(form))
        });
        window.location.href = "merci.html";
      } catch (err) {
        console.error(err);
        status.className = "form-status error";
        status.textContent = "השליחה נכשלה. בדקו חיבור ונסו שוב, או פנו בוואטסאפ.";
        btn.disabled = false;
      }
    });
  });

  /* ===== באנר עוגיות ===== */
  const cookie = document.getElementById("cookie");
  if (cookie) {
    let accepted = false;
    try { accepted = localStorage.getItem("cookie_ok") === "1"; } catch (e) {}
    if (!accepted) cookie.classList.add("show");
    cookie.querySelector("button").addEventListener("click", () => {
      cookie.classList.remove("show");
      try { localStorage.setItem("cookie_ok", "1"); } catch (e) {}
    });
  }

  /* ===== הופעה בגלילה ===== */
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: .12 });
    items.forEach(i => io.observe(i));
  } else items.forEach(i => i.classList.add("in"));

  /* ===== שנה בפוטר ===== */
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
});
