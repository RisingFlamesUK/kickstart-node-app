# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.1.1] - 2025-09-19
### Fixed
- `kickstart-node-app --version` now reports the correct version from `package.json`.

## [1.1.0] - 2025-09-19
### Added
- **Microsoft OAuth 2.0** strategy (`passport-microsoft-oauth20.ejs`) with config, generator wiring, and provider doc.
* **Bearer token authentication**:
  - **Token store** (`utils/token-store.js`) that stores only the SHA-256 **hash** of tokens.
  - **`api_tokens`** table created lazily by the token store.
  - Helpers: `issueToken`, `verifyToken`, `revokeToken`, `pruneExpired`.
  - Optional hardening via `TOKEN_HASH_PEPPER` in `.env`.
  - **Scope middleware**: `utils/ensure-scope.js` (`ensureScope`, `ensureAnyScope`) for per-route authorization.
  - **Demo API router** (`routes/api.js`) with a protected `/api/me` route and scope usage example.
  - **Helper CLI** (`scripts/auth-tools.mjs`) to create users and issue tokens.
    - NPM scripts auto-added when Bearer is selected:
      - `"user:create": "node scripts/auth-tools.mjs create-user"`
      - `"token:issue": "node scripts/auth-tools.mjs issue-token"`
      - `"token:create": "node scripts/auth-tools.mjs create-and-token"`
* **Environment validation** (`utils/validate-env.js`) for clear startup errors when PG or OAuth env vars are missing.
* **Auth guards**: `utils/ensure-auth.js` for protecting routes that require sessions.
* **Shared security utilities** (`utils/security.js`) for bcrypt and token hashing.
* **Dev-only session check** middleware (`middleware/session-check.js`).
* **User Documentation** tailored to selected features:
  - Tailored project **README** with links only to included features.
  - App architecture doc: `docs/architecture.md` (Mermaid diagrams of components and flows).
  - Feature docs as selected: `docs/postgres.md`, `docs/sessions.md`, `docs/axios.md`.
  - Provider docs as selected: `docs/google-oauth.md`, `docs/local-sessions.md`, `docs/microsoft-oauth.md`, `docs/bearer-tokens.md`.
  - **NEXT_STEPS.md** with deterministic numbering, provider-specific sections, and a clear note to **restart the dev server after editing `.env`**.
* **Contributor documentation**:
  - `docs/architecture-generator.md` (scaffolder internals),
  - Updated `docs/dev-setup.md` (local linking & testing flows).

### Changed
* **Database module** standardized to `config/database.js`; improved defaults:
  - `PG_PASS` may be empty by default.
  - `PG_PORT` now defaults to `5432` and is parsed with a radix.
- **Session store** creation centralized via `createSessionStore()` (uses `connect-pg-simple` with `tableName: 'session'` and `createTableIfMissing: true`).
* `.gitignore` template refresh:
   - Latest Node.gitignore base plus a few practical additions.
* **Generator (`webgen.js`)**
  - Renders per‑provider docs and example routes only for selected strategies.
  - Uses centralized path helpers and improves .gitignore handling (append/enrich instead of overwrite).
  - Adds Bearer CLI scripts to `package.json` only when Bearer is selected.
  - Unifies view‑locals seeding in `app.ejs`; mounts `/api` router only when Bearer is selected
* **Generated app README**: cleaned formatting and gated doc links.
* Local strategy now uses centralized `verifyPassword` (bcrypt) from `utils/security.js`.
* **Template headers** added to all rendered files (e.g., `// This file is /app.js` and EJS source path comments) to make copy/paste into support tools clearer. Cosmetic only; no runtime changes. Static files are unchanged.
* Google strategy ('config/passport-google-oauth20.ejs') now marks 'accessToken' and 'refreshToken' parameters as intentionally unused using '_'. Additional comments added and further detail in `docs/google-oauth.md`
* Startup hardening: app now verifies Postgres connectivity on boot and shows concise, actionable errors (codes like 28P01, 3D000, etc.).
* Graceful shutdown: added HTTP server shutdown and Postgres pool close handlers on SIGINT/SIGTERM (and SIGUSR2 when present).
* Cleaner generated code: applied EJS whitespace control across templates (no stray blank lines); Google strategy verify callback now marks unused accessToken/refreshToken with _ and the docs explain how to opt in to token usage.

### Fixed
- Static **.gitignore** no longer gets unintentionally overwritten during generation.
- Minor consistency fixes across templates and generator wiring.

### Known issues

* **Local login fails for OAuth-only accounts.**
  If a user registered via Google/Microsoft (no `password_hash` in DB) then tries to sign in with email/password, the local strategy throws a bcrypt error (`data and hash arguments required`) and returns a 500.
  **Workaround:** sign in with the provider used to register.
  **Planned for 1.1.1:** the local strategy will detect missing `password_hash` and fail gracefully with a friendly message (e.g., “This account uses Google/Microsoft. Please sign in with that provider or set a password.”).

* **Single-provider overwrite on same email.**
  Signing in with a second OAuth provider that uses the same email replaces the existing `provider`/`provider_id` on the user record (last provider wins). This effectively “moves” the account between providers and can break the previous login method.
  **Workaround:** stick to a single provider per email for now.
  **Planned for 1.1.1:** support multiple provider links per user (e.g., a `user_providers` table) so Google and Microsoft can both be associated with the same account without overwriting.


---

## [1.0.0] - 2025-08-20
### Added
- Initial stable release 🎉
- CLI command: `kickstart-node-app web <project-name>`
- Interactive and flag-driven modes
- Conditional support for:
  - PostgreSQL (`--pg`)
  - Session management (`--session`)
  - Axios (`--axios`)
- Passport.js authentication strategies:
  - Local (email/password)
  - Google OAuth 2.0
  - Stubs for Bearer (token-based), Facebook, Twitter, Microsoft, LinkedIn, Steam, Amazon
- `.env` file generation with placeholders
- Automatic Postgres + session store setup (`connect-pg-simple`)
- EJS-rendered templates for `views/`, `routes/`, and config files
- Next steps guide (`NEXT_STEPS.md`) with provider setup instructions
- Auto-detects `nodemon` for dev script
- Git initialization with `.gitignore`