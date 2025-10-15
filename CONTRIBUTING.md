# Contributing to TrakrLog

Thank you for your interest in contributing to TrakrLog! We welcome all contributions—bug reports, feature requests, code, and documentation. This guide will help you get started and ensure your contributions fit the project's structure and standards.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Project Structure](#project-structure)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Guidelines](#coding-guidelines)
- [Pull Request Process](#pull-request-process)
- [Security](#security)
- [Community & Support](#community--support)

---

## Code of Conduct
By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md) and foster a welcoming, respectful environment.

## Project Structure
TrakrLog is a pnpm monorepo with the following layout:

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

- **Backend:** Modular Express API (see `apps/backend/src/features/`)
- **Frontend:** React app with modular components (see `apps/frontend/src/components/`)
- **Shared:** Common types and utilities in `packages/common/`

## How to Contribute
1. **Fork the repository** and clone your fork.
2. **Create a new branch** for your change: `git checkout -b feature/my-feature`.
3. **Make your changes** following the guidelines below.
4. **Test your changes** locally.
5. **Commit** with a clear, descriptive message.
6. **Push** to your fork and open a Pull Request (PR) against the `main` branch.

## Development Setup
- Install [pnpm](https://pnpm.io/) if you don't have it: `npm install -g pnpm`
- Install dependencies: `pnpm install`
- Run all apps/packages: `pnpm dev` (or see individual app README.md for details)
- Build: `pnpm build`
- Lint: `pnpm lint`

## Coding Guidelines
- **TypeScript:** Strict mode everywhere. Prefer explicit types for functions and models.
- **ESLint:** Lint before committing. Use the provided config (`eslint.config.js`).
- **Naming:**
  - Files: kebab-case or PascalCase for components
  - Variables: camelCase
  - Types/Interfaces: PascalCase
- **Backend:**
  - Place new features in `apps/backend/src/features/`
  - Use service/controller/model separation
  - Use RESTful routes and standard API responses (see `@trakrlog/common/httpResponse.ts`)
- **Frontend:**
  - Place new UI in `apps/frontend/src/components/`
  - Use functional components and hooks
  - Style with Tailwind CSS and follow dark theme conventions
- **Tests:** Add or update tests for new features or bugfixes when possible.
- **Docs:** Update or add documentation as needed (README.md, this file, etc).

## Pull Request Process
- Ensure your branch is up to date with `main`.
- Describe your changes clearly in the PR description.
- Reference related issues (e.g., `Fixes #123`).
- Pass all CI checks (build, lint, tests).
- Be open to feedback and requested changes.

## Security
- Do **not** report security issues in public. See [SECURITY.md](SECURITY.md) for responsible disclosure instructions.
- Follow best practices for secrets, API keys, and session config.

## Community & Support
- For questions, open a [Discussion](https://github.com/trakrlog-com/trakrlog/discussions) or join our community channels.
- For bugs or feature requests, open an [Issue](https://github.com/trakrlog-com/trakrlog/issues).

---

Thank you for helping make TrakrLog better! 💙
