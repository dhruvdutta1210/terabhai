# TERA BHAI front page — GitHub Pages + Supabase

This is a lightweight HTML/CSS/JavaScript website. GitHub hosts the files; Supabase stores the project cards and handles admin login. No Node.js server or React is required.

## Important: how the admin panel works
A static GitHub Pages website cannot safely save shared settings by itself. This version uses Supabase as a small hosted database/auth service so project changes made in `admin.html` show up for every visitor. The public key in `config.js` is intended to be visible; the database policies protect edits. **Never put a Supabase `service_role` key in this repository.**

## 1. Create the Supabase backend
1. Create a free project at https://supabase.com/
2. Open **SQL Editor → New query**.
3. Paste and run the SQL below. Replace `YOUR_ADMIN_EMAIL@example.com` with the one email address you will use to sign in. Use the same email when you create the admin user in step 4.

```sql
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  url text not null,
  category text not null default 'PROJECT',
  status text not null default 'Experimental',
  display_order integer not null default 10,
  icon text not null default '✳',
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "Anyone can view projects" on public.projects;
create policy "Anyone can view projects"
on public.projects for select
to anon, authenticated
using (true);

drop policy if exists "Admin can add projects" on public.projects;
create policy "Admin can add projects"
on public.projects for insert
to authenticated
with check ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL@example.com');

drop policy if exists "Admin can edit projects" on public.projects;
create policy "Admin can edit projects"
on public.projects for update
to authenticated
using ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL@example.com')
with check ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL@example.com');

drop policy if exists "Admin can delete projects" on public.projects;
create policy "Admin can delete projects"
on public.projects for delete
to authenticated
using ((auth.jwt() ->> 'email') = 'YOUR_ADMIN_EMAIL@example.com');
```

4. In Supabase, open **Authentication → Users → Add user** and create the one admin email/password. Disable public sign-ups in **Authentication settings** if enabled. Do not share this password.
5. Open **Project Settings → API** (or the API Keys section). Copy the Project URL and the **anon/public** key.

## 2. Configure the site
1. Open `config.js`.
2. Replace `PASTE_SUPABASE_PROJECT_URL_HERE` with your Supabase Project URL.
3. Replace `PASTE_SUPABASE_ANON_PUBLIC_KEY_HERE` with your anon/public key.
4. Make sure the email in the SQL policies exactly matches the admin user email.
5. Save all files.

## 3. Upload to GitHub
1. Create a repository, for example `terabhai-online`.
2. Upload `index.html`, `admin.html`, `style.css`, `app.js`, `admin.js`, and `config.js` to the repository root.
3. Commit the files.
4. Go to **Settings → Pages**. Under Build and deployment, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
5. Wait for GitHub Pages to publish.

## 4. Connect terabhai.online
In the repository, go to **Settings → Pages → Custom domain**, enter `terabhai.online`, and save. Follow the DNS instructions GitHub shows. Since your DNS is managed by Cloudflare, add the exact records GitHub requests. For a typical apex domain, GitHub Pages uses A records pointing to its published IP addresses; for `www`, use a CNAME to `<your-github-username>.github.io`. Avoid proxying the GitHub Pages records through Cloudflare while setting up TLS; use **DNS only** until GitHub issues the certificate. Then enable **Enforce HTTPS** in GitHub Pages. Check GitHub's current docs if the shown records differ.

## 5. Use the admin panel
- Open `https://terabhai.online/admin.html`
- Sign in with your admin email and password.
- Add a project: name, description, URL, category, status, order, and emoji.
- Edit or delete existing projects. Changes publish to the public homepage automatically.
- The Status buttons link to `https://status.terabhai.online`. Make sure that subdomain has its own DNS and a real status page.

## Security / maintenance
- Admin access is restricted by Supabase Row Level Security to the single email in your SQL policies.
- Never commit a service-role key, database password, or other secret.
- Use a strong unique admin password and enable MFA on your Supabase account if available.
- Project links are opened in a new tab with `noopener noreferrer`.
- This front page does not itself provide email hosting, file hosting, or status monitoring. It is a directory/launchpad linking to those services as you create them.


## SEO and copyright page
- `index.html` includes a descriptive title, meta description, canonical URL, Open Graph/Twitter metadata, and Organization structured data.
- `robots.txt` gives crawlers the sitemap and excludes the admin page from crawling.
- `sitemap.xml` lists the homepage and copyright page. Add any other public pages you create.
- `copyright.html` is linked from the footer and contains a general copyright / intellectual-property notice.
- Once the site is live, verify `https://terabhai.online/` in Google Search Console and submit `https://terabhai.online/sitemap.xml`. Indexing is not guaranteed and can take time.
- SEO metadata helps search engines understand the site; it does not guarantee rankings. Keep page content useful and unique.
- The copyright notice claims rights only over original material TERA BHAI actually owns. Keep licences, contributor agreements, and proof of authorship for any project code/content.
