# Self-Hosted eQHub Architecture Documentation

I'll produce two deliverables tailored to the Apps team demo, written from the actual `docker-compose.prod.yml`, Dockerfiles, Kong config, and frontend source in this repo (not generic Supabase boilerplate).

## Deliverables

1. **`eQHub-Architecture.docx`** — the reference document the team keeps after the demo.
2. **`eQHub-Architecture.pptx`** — ~10-slide deck to drive the live walkthrough.

Both files written to `/mnt/documents/` and surfaced as artifacts.

## DOCX contents (~15 pages)

1. **Executive summary** — what eQHub is, why self-hosted on a Rocky Linux VM, what the Apps team is looking at.
2. **High-level architecture** — ASCII diagram of browser → Nginx (frontend) → Kong → {Auth, REST, Storage} → Postgres, plus SMTP relay sidecar and Studio/Meta side channel.
3. **Deployment topology** — single Rocky Linux VM, Docker Compose, host port mapping (80, 8000, 3000, 5432, 8443), `app-network` bridge, persistent volumes (`supabase-db-data`, `supabase-storage-data`), `.env`-driven config, `deploy.sh` redeploy flow.
4. **Service-by-service deep dive** — one section per container, each covering: image/version, role, host & internal ports, key env vars, who calls it, who it calls, failure modes:
   - `frontend` (Nginx serving Vite build of React/TS app)
   - `supabase-kong` (API gateway, routes `/auth/v1`, `/rest/v1`, `/storage/v1`, key-auth + CORS)
   - `supabase-auth` (GoTrue — JWT issuance, password recovery, SMTP via sidecar)
   - `supabase-rest` (PostgREST — auto-generated REST API over `public` + `storage` schemas, RLS enforced)
   - `supabase-storage` (file storage backed by local disk volume)
   - `supabase-db` (Postgres 15 with migrations auto-applied on first boot)
   - `supabase-meta` + `supabase-studio` (admin-only DB management UI)
   - `smtp-relay` (Postfix sidecar forwarding GoTrue email to corporate relay, bypassing expired upstream TLS)
5. **Backend in depth** — schema overview, RLS strategy, `user_roles` table + `has_role()` security-definer pattern, 4-tier RBAC (Admin / Content Admin / Moderator / User), key DB functions (`current_user_profile_id`, `is_admin_or_moderator`, `remove_user_and_reassign_content`), notification trigger, storage buckets and their RLS, JWT secret consistency requirements across GoTrue/PostgREST/Storage.
6. **Frontend in depth** — Vite + React 18 + TypeScript, Tailwind + shadcn/ui, TanStack Query for data, React Router pages under `src/pages/`, `useAuth` provider wiring Supabase session → profile → role hooks (`useRoles`), `ProtectedRoute`, layout system (BrandingBanner, AppSidebar, TopNav, PageLayout), build pipeline (`bunx vite build` → `nginx:alpine`), env injection at build time via `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.
7. **Request lifecycle walkthroughs** — three traced flows: (a) user login, (b) authenticated REST query with RLS, (c) password recovery email through GoTrue → Postfix sidecar → corporate relay.
8. **Operations** — update workflow (`git pull` → `docker compose up -d --build`), log inspection commands, common failure modes (SMTP relay refused, JWT mismatch, storage permission), backup/restore notes for the two named volumes.
9. **Security posture** — RLS-everywhere, no service-role key in browser, Kong key-auth on REST/Storage, role checks via security-definer functions, network restrictions (5432/6543 blocked outbound).
10. **Appendix** — full port table, env var reference, image-version table.

## PPTX contents (~10 slides)

1. Title — "eQHub: Self-Hosted Architecture Overview"
2. What & why (one-VM Supabase + React app, no cloud dependency)
3. Architecture diagram (rendered image)
4. The container stack (table of 9 services with one-line roles)
5. Frontend stack (React/Vite/Tailwind/shadcn/TanStack Query)
6. Backend stack (Postgres + GoTrue + PostgREST + Storage + Kong)
7. Auth & RBAC (4 roles, RLS, `has_role` pattern)
8. Request flow diagram (browser → Kong → service → DB)
9. Ops & deployment (`deploy.sh`, volumes, logs)
10. Q&A / what to demo live

Visual style: dark navy + accent palette, large typographic stats, no generic blue gradients, ASCII-free on slides (images only).

## Technical notes

- DOCX built with `docx` (npm) following the bundled docx skill: explicit US Letter sizing, Arial default, `LevelFormat.BULLET` for lists, dual-width tables.
- PPTX built with `pptxgenjs` following the bundled pptx skill: base64-embedded images, 40-54pt titles, committed color palette, QA pass by converting to PDF → images and inspecting each slide.
- Architecture diagrams generated as PNGs (one stack diagram, one request-flow diagram) and embedded in both files.
- Content drawn from this repo's actual files — `docker-compose.prod.yml`, `Dockerfile.prod`, `docker/kong.yml`, `docker/nginx.conf`, `src/hooks/useAuth.tsx`, `src/hooks/useRoles.ts`, `src/integrations/supabase/client.ts`, plus the DB functions already in context — so service names, versions, ports, and behaviours match what the team will see in the demo.

Approve and I'll generate both files and hand back artifact links.