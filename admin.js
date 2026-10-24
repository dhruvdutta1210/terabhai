(() => {
  const cfg = window.TB_CONFIG || {};
  const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes("PASTE_") && !cfg.SUPABASE_ANON_KEY.includes("PASTE_");
  const $ = id => document.getElementById(id);
  const loginCard = $("login-card"), dashboard = $("dashboard");
  let client = null;

  function message(id, text, bad = false) {
    const el = $(id); el.textContent = text; el.classList.toggle("error", bad);
  }
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function resetForm() {
    $("project-form").reset(); $("project-id").value = ""; $("project-order").value = "10";
    $("save-button").textContent = "Save project ↗"; message("project-message", "");
  }
  function showDashboard(user) {
    loginCard.hidden = !!user; dashboard.hidden = !user;
    if (user) loadProjects();
  }
  async function loadProjects() {
    const list = $("admin-projects");
    list.innerHTML = '<p class="muted">Loading projects…</p>';
    const { data, error } = await client.from("projects").select("*").order("display_order", {ascending:true}).order("created_at", {ascending:false});
    if (error) { list.innerHTML = ""; message("project-message", error.message, true); return; }
    if (!data.length) { list.innerHTML = '<p class="muted">No projects yet. Add your first one above.</p>'; return; }
    list.innerHTML = data.map(p => `<div class="admin-project">
      <div class="admin-project-icon">${esc(p.icon || "✳")}</div><div class="admin-project-info"><strong>${esc(p.name)}</strong><span>${esc(p.category || "PROJECT")} · ${esc(p.status || "Experimental")} · order ${esc(p.display_order)}</span><small>${esc(p.url)}</small></div>
      <button class="mini-button" data-edit="${esc(p.id)}">Edit</button><button class="mini-button danger" data-delete="${esc(p.id)}">Delete</button>
    </div>`).join("");
    list.querySelectorAll("[data-edit]").forEach(btn => btn.addEventListener("click", () => {
      const p = data.find(x => x.id === btn.dataset.edit); if (!p) return;
      $("project-id").value = p.id; $("project-name").value = p.name; $("project-description").value = p.description;
      $("project-url").value = p.url; $("project-category").value = p.category || ""; $("project-status").value = p.status || "Experimental";
      $("project-order").value = p.display_order ?? 10; $("project-icon").value = p.icon || "";
      $("save-button").textContent = "Update project ↗"; window.scrollTo({top:0, behavior:"smooth"});
    }));
    list.querySelectorAll("[data-delete]").forEach(btn => btn.addEventListener("click", async () => {
      const p = data.find(x => x.id === btn.dataset.delete);
      if (!p || !confirm(`Delete "${p.name}" from the homepage?`)) return;
      const { error } = await client.from("projects").delete().eq("id", p.id);
      if (error) message("project-message", error.message, true); else { message("project-message", "Project deleted."); loadProjects(); }
    }));
  }

  if (!configured || !window.supabase) {
    message("login-message", "Setup needed: add your Supabase URL and anon key to config.js, then follow README.md.", true);
  } else {
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    client.auth.getSession().then(({data}) => showDashboard(data.session?.user || null));
    client.auth.onAuthStateChange((_event, session) => showDashboard(session?.user || null));
  }

  $("login-form").addEventListener("submit", async e => {
    e.preventDefault(); if (!client) return;
    message("login-message", "Signing in…");
    const { error } = await client.auth.signInWithPassword({ email: $("login-email").value.trim(), password: $("login-password").value });
    if (error) message("login-message", error.message, true);
  });
  $("logout-button").addEventListener("click", async () => { await client.auth.signOut(); showDashboard(null); });
  $("project-form").addEventListener("submit", async e => {
    e.preventDefault(); if (!client) return;
    const id = $("project-id").value;
    const record = {
      name: $("project-name").value.trim(), description: $("project-description").value.trim(),
      url: $("project-url").value.trim(), category: $("project-category").value.trim() || "PROJECT",
      status: $("project-status").value, display_order: Number($("project-order").value) || 10,
      icon: $("project-icon").value.trim() || "✳"
    };
    try { new URL(record.url); } catch { message("project-message", "Enter a valid full URL starting with https://", true); return; }
    const result = id ? await client.from("projects").update(record).eq("id", id) : await client.from("projects").insert(record);
    if (result.error) { message("project-message", result.error.message, true); return; }
    message("project-message", id ? "Project updated and published." : "Project added and published.");
    resetForm(); loadProjects();
  });
  $("reset-button").addEventListener("click", resetForm);
  $("refresh-button").addEventListener("click", loadProjects);
})();