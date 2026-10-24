(() => {
  const config = window.TB_CONFIG || {};
  const configured = config.SUPABASE_URL && config.SUPABASE_ANON_KEY &&
    !config.SUPABASE_URL.includes("PASTE_") && !config.SUPABASE_ANON_KEY.includes("PASTE_");
  const grid = document.getElementById("project-grid");
  const empty = document.getElementById("empty-state");
  document.getElementById("year").textContent = new Date().getFullYear();

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
  const safeUrl = value => {
    try { const u = new URL(value); return ["http:", "https:"].includes(u.protocol) ? u.href : "#"; }
    catch { return "#"; }
  };

  function render(projects) {
    grid.innerHTML = "";
    if (!projects.length) { empty.hidden = false; return; }
    empty.hidden = true;
    projects.forEach((p, i) => {
      const card = document.createElement("article");
      card.className = "project-card reveal";
      card.style.setProperty("--delay", `${i * 70}ms`);
      const statusClass = p.status === "Live" ? "live" : "other";
      card.innerHTML = `
        <div class="card-top"><span class="project-icon">${escapeHTML(p.icon || "✳")}</span><span class="project-status ${statusClass}"><i></i>${escapeHTML(p.status || "Experimental")}</span></div>
        <div class="project-category">${escapeHTML(p.category || "PROJECT")}</div>
        <h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.description)}</p>
        <a class="project-open" href="${escapeHTML(safeUrl(p.url))}" target="_blank" rel="noopener noreferrer">Open project <span>↗</span></a>`;
      grid.appendChild(card);
    });
    observeReveal();
  }

  function observeReveal() {
    const nodes = document.querySelectorAll(".reveal:not(.shown)");
    if (!("IntersectionObserver" in window)) { nodes.forEach(n => n.classList.add("shown")); return; }
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("shown"); io.unobserve(e.target); }
    }), { threshold: .12 });
    nodes.forEach(n => io.observe(n));
  }

  async function loadProjects() {
    if (!configured || !window.supabase) {
      grid.innerHTML = `<div class="setup-notice"><strong>Almost ready.</strong><br>Connect Supabase using the setup steps in README.md, then add projects from <a href="admin.html">the admin panel</a>.</div>`;
      return;
    }
    try {
      const client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
      const { data, error } = await client.from("projects").select("*").order("display_order", { ascending: true }).order("created_at", { ascending: false });
      if (error) throw error;
      render(data || []);
    } catch (err) {
      grid.innerHTML = `<div class="setup-notice">Could not load projects. Check your Supabase setup and table policies.<br><small>${escapeHTML(err.message || "Unknown error")}</small></div>`;
    }
  }

  const menu = document.querySelector(".menu-toggle");
  if (menu) menu.addEventListener("click", () => document.querySelector(".nav-links").classList.toggle("nav-open"));
  loadProjects();
})();