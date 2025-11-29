# TrakrLog Codebase Overview

## Monorepo Structure

TrakrLog is a modern, open-source event tracking platform for indie devs and SaaS. The codebase is organized as a pnpm monorepo with the following structure:

```
trakrlog/
├── apps/
│   ├── backend/         # Node.js/Express API server (TypeScript, MongoDB)
│   └── frontend/        # React web app (Vite, TypeScript, Tailwind)
├── packages/
│   ├── common/          # Shared TypeScript code (types, utils, API responses)
│   └── tsconfig/        # Shared tsconfig base and variants
├── turbo.json           # TurboRepo build orchestration
├── pnpm-workspace.yaml  # pnpm workspace config
├── package.json         # Monorepo root scripts
└── ...
```

## Backend (apps/backend)
- **Framework:** Express 5, TypeScript, MongoDB (Mongoose)
- **Features:** Modular structure under `src/features/` (auth, projects, channels, events)
- **Config:**
  - `src/config/database.ts` — MongoDB connection
  - `src/index.ts` — App entry, middleware, session, CSP, static serving, route mounting
- **Auth:** Passport.js (Google OAuth2), session-based, with secure cookie/session config for Azure
- **API Conventions:**
  - RESTful endpoints, grouped by feature
  - Consistent error/success responses via `@trakrlog/common/httpResponse.ts`
  - Input validation (express-validator, custom checks)
- **Models:**
  - All models extend a `BaseModel` (id, name, key, description, timestamps)
  - Example: `Project`, `Channel`, `Event`
- **Code Style:**
  - TypeScript strict mode
  - ESNext modules, ESM imports
  - Linting via ESLint (see `lint` script)
  - Service/controller separation for business logic

## Frontend (apps/frontend)
- **Framework:** React 19, Vite, TypeScript, Tailwind CSS
- **Structure:**
  - `src/components/` — UI components (app, dialogs, public)
  - `src/context/` — React context for auth, dashboard, notifications
  - `src/pages/` — Route-based pages (dashboard, login, main, etc.)
  - `src/hooks/` — Custom hooks (e.g., useFetch)
  - `src/utils/` — Utility functions
- **Styling:**
  - Tailwind CSS (custom properties for dark theme)
  - Component-level and utility classes in `App.css`
- **Code Style:**
  - TypeScript strict mode
  - ESM modules
  - ESLint with React, TypeScript, and hooks plugins
  - Functional components, hooks-first
  - Consistent naming: PascalCase for components, camelCase for functions/vars
- **UI/UX:**
  - Headless UI for transitions/dialogs
  - React-icons for icons
  - Responsive layout, dark mode by default

## Shared Package (packages/common)
- **Purpose:** Shared types, API response codes, utility functions
- **Conventions:**
  - All API responses use a standard shape (see `httpResponse.ts`)
  - Types for models, API codes, and keys

## Build & Tooling
- **TurboRepo:** Orchestrates builds, lint, dev, and start scripts across apps/packages
- **pnpm:** Fast, disk-efficient package manager
- **TypeScript:** Shared configs in `packages/tsconfig/`
- **Vite:** Fast dev/build for frontend
- **Bun:** Used for backend dev (see backend/package.json), Node.js for prod

## Code Conventions
- **TypeScript:**
  - Always strict mode
  - Prefer explicit types for function signatures and models
  - Use interfaces/types for all API payloads
- **ESLint:**
  - Enforced via scripts and config (see `eslint.config.js`)
  - Plugins: React, React Hooks, TypeScript
- **Naming:**
  - Files: kebab-case or PascalCase for components
  - Variables: camelCase
  - Types/Interfaces: PascalCase
- **Folder Structure:**
  - Features are modular (backend)
  - Components are grouped by domain (frontend)
- **API:**
  - RESTful, versionless (for now)
  - Consistent error handling and status codes
- **Security:**
  - Helmet for CSP (relaxed for Vite/React)
  - Secure cookies, session config for Azure
  - See `SECURITY.md` for disclosure and self-hosting best practices

## How to Use This File
- Use as a reference for code reviews, PRs, and onboarding
- Copilot/Claude: Use this to understand project structure, conventions, and where to place new code
- Update this file as the codebase evolves

---

For more details, see the individual README.md files in each app/package.
