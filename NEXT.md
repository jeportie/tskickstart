# NEXT: tskickstart — New Project Types

## Completed

- [x] **Prompt system refactoring** — Modular `prompts/`, `generators/`, `templates/`, `utils/` architecture
- [x] **Frontend starter** — React + Vite + Tailwind CSS v4 with component tests
- [x] **Playwright E2E** — Optional scaffold for frontend/fullstack projects
- [x] **Structural cleanup** — Directory renames, eslintignore removal, template bug fixes

---

## Up Next

### 1. `npm-lib` — Library published to npm

**Unique tools to add:**

- [ ] **Build:** `tsup` — dual CJS/ESM output + declaration files in one command
- [ ] **Versioning:** `semantic-release` + `conventional-changelog-conventionalcommits`
- [ ] **Package manager choice:** `npm` (default) or `pnpm`
- [ ] **GitHub Actions:** PR checks + semantic-release + npm publish workflows

**tsconfig specifics:**

- `declaration: true`, `declarationMap: true`, `sourceMap: true`
- `exports` field in `package.json` with proper CJS/ESM paths

**Notes:** Closest to the current setup — mainly needs tsup + build pipeline + conditional semantic-release.

---

### 2. `cli` — Node.js CLI tool

**Unique tools to add:**

- [ ] `commander` or `@clack/prompts` for argument parsing / interactive prompts
- [ ] `bin` field in `package.json`
- [ ] Shebang in entry file (`#!/usr/bin/env node`)
- [ ] Optional: `pkg` or `ncc` for standalone binary distribution
- [ ] Build: `tsup` with `--format cjs` only + `--shims` flag
- [ ] Semantic-release if publishing to npm, otherwise skip

**Plus for frontend:**

- [ ] **Tool versioning:** `mise`
- [ ] **Versioning:** NOT semantic-release — conventional commits only or nothing

---

### 3. `backend` — Node.js API/server

**Unique tools to add:**

- [ ] **Framework selection:**
  - `Hono` (recommended — TypeScript-first, ultrafast, platform-agnostic)
  - `Fastify` (production-proven, excellent performance)
  - `Express` (legacy/familiarity only)
- [ ] **Tool versioning:** `mise` (`.mise.toml` with node version pinned)
- [ ] **Dev server:** `tsx --watch` for hot reload
- [ ] **Env validation:** `zod` schema (`src/env.ts`) for type-safe environment variables
- [ ] **Containerization:** `Dockerfile` + `docker-compose.yml` for dev
- [ ] **Versioning:** NOT semantic-release (it's an app). Optional: `release-it` for changelog
- [ ] **CI:** PR checks + deploy workflow (Railway, Fly.io, or generic placeholder)

**package.json scripts:**

```json
{
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

---

### 4. `app` — Mobile Application (React Native)

**Unique tools to add:**

- [ ] **Framework:** React Native (Expo managed workflow or bare)
- [ ] **Navigation:** React Navigation v7
- [ ] **State management:** TanStack Query v5 (same as frontend)
- [ ] **E2E testing:** Detox (replaces Playwright for mobile)
- [ ] **Unit testing:** Jest + React Native Testing Library
- [ ] **Build/deploy:** EAS Build + EAS Submit (Expo) or Fastlane (bare)
- [ ] **Tool versioning:** `mise` (node) + Xcode/Android SDK management
- [ ] **CI:** PR checks + EAS build workflow

**Template structure:**

```
src/templates/app/
  app.json                    # Expo config
  babel.config.js
  metro.config.js
  tsconfig.json
  src/
    App.tsx                   # Navigation container
    screens/
      HomeScreen.tsx
    components/
    navigation/
      index.tsx
  tests/
    setup.ts
    unit/
    e2e/
      .detoxrc.js
      firstTest.e2e.ts
```

**package.json scripts:**

```json
{
  "start": "expo start",
  "android": "expo run:android",
  "ios": "expo run:ios",
  "test": "jest",
  "test:e2e:build": "detox build --configuration ios.sim.debug",
  "test:e2e": "detox test --configuration ios.sim.debug"
}
```

**Implementation steps:**

1. Create `src/templates/app/` with all template files
2. Create `src/prompts/app.js` — Expo vs bare workflow prompt, navigation choice
3. Create `src/generators/app.js` — `generateApp(answers, cwd)`: copy templates, install deps
4. Wire into `src/index.js` orchestrator
5. Create `tests/integration/app.int.test.js`
