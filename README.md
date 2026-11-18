# ESEKONE Workspace

The authenticated customer workspace for ESEKONE — a modular operating system for running a business.

## What is connected today

- OIDC authentication gate and authenticated identity bootstrap.
- First-run flow to create an organization and its initial workspace.
- Workspace dashboard reads live data from the ESEKONE API; it does not use hard-coded sample counts.
- Overview cards display contacts, customer records, open tasks and active projects.
- The dashboard also shows total projects, tasks due today and the latest workspace tasks.
- English/Hebrew language toggle and an initial RTL layout foundation.

## Local development

```bash
npm install
cp .env.example .env
npm run dev
npm run typecheck
npm run build
```

Set the browser-safe environment variables in `.env`:

- `VITE_API_BASE_URL` — ESEKONE API base URL.
- `VITE_OIDC_AUTHORITY` — OIDC issuer/authority.
- `VITE_OIDC_CLIENT_ID` — public browser client identifier registered with the identity provider.

Register the callback URL `/auth/callback` and the intended sign-out/redirect URLs with the identity provider. Never put Neon connection strings, API secrets or private OIDC client credentials in Vite `VITE_*` variables; these are shipped to the browser.

## Current scope and known gaps

The dashboard and onboarding are connected to the API, but this is not yet the complete Business OS. Customer, project, calendar, commerce, documents, automation, insights and settings navigation is still being implemented module by module. Do not treat the visible navigation or assistant prompt box as proof that those workflows are already active.

The workspace API, database schema and tenant isolation are maintained in the separate `keshevplus/ESEKONE` repository. The browser communicates only with the API; PostgreSQL credentials remain server-side.

## Internationalization and accessibility

The interface currently has English/Hebrew copy and an RTL foundation. Production UI copy should move through translation keys and locale resources, with user-overridable locale detection, keyboard accessibility and responsive layouts verified before launch.

## Release flow

Feature branches are validated by CI and do not trigger Vercel preview deployments by default. Merge tested changes to `dev` for integration, then promote the tested release to `main`. See the core repository's release gates before production promotion.
