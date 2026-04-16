# Admin panel (supervisor web UI)

Stage 1 supervisor dashboard for an industrial equipment inspection workflow. The mobile app is used by field inspectors; this web app is for supervisors to monitor tasks, equipment, and defects.

- **Stack:** Next.js (App Router), TypeScript, Tailwind CSS  
- **Data:** mock JSON-like modules under `lib/data/mock/` (no backend)  
- **Auth:** demo-only session flag in `sessionStorage` (not real authentication)  
- **UI language:** Russian for all user-visible strings (see `docs/ADMIN_CASE_CONTEXT.md`)

## Run locally

The app is in **`field_inspector_web/admin_panel`**, not in your user home folder. From `C:\Users\H O N O R` you must `cd` into that path first.

**Windows (CMD or PowerShell):**

```bat
cd /d C:\Users\H O N O R\field_inspector_web\admin_panel
npm install
npm run dev
```

From the repo root:

```bat
cd C:\Users\H O N O R\field_inspector_web
cd admin_panel
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **«Войти (демо)»** on the login screen to access the dashboard.

## Scripts

- `npm run dev` — development server  
- `npm run build` — production build  
- `npm run start` — run production server  
- `npm run lint` — ESLint  

## Project layout (high level)

- `app/` — routes (App Router), including login and main shell  
- `components/` — layout and reusable UI  
- `lib/data/mock/` — mock entities and demo datasets  
- `types/` — shared TypeScript types  
- `docs/` — developer context  

## Next steps (suggestions)

- Replace mock modules with REST/GraphQL clients and typed DTOs  
- Add real authentication (OIDC, sessions, or similar)  
- Role-based navigation and audit logging  
- Reports export (PDF/Excel) and saved filters  
