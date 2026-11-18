# ESEKONE Workspace

The authenticated workspace experience for ESEKONE — a modular operating system for running a business.

## Local development
```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Product direction
This is the signed-in workspace, not the public marketing homepage. It is designed around a configurable business workspace with navigation for customer relationships, projects, calendar, commerce, documents, automation and insights.

The current dashboard is a frontend foundation with illustrative sample metrics. It is not connected to a production API, billing provider or live customer data yet. Do not interpret sample figures as real business data.

## Internationalization
The interface includes English and Hebrew copy and an RTL layout foundation. All production UI copy should move through translation keys and locale resources before launch. Browser locale detection must remain overridable by the user.
