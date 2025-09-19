# Kickstart Node — Generator Architecture (For Contributors)

This document describes **how the scaffolder works**: template layout, render pipeline, feature gating, and where to add new capabilities. It is not shipped into generated projects.

---

## Goals

* Deterministic scaffolding from a small set of flags/prompts.
* Clear separation between **static copy** vs **rendered templates**.
* Feature gating (PG, Sessions, Axios, Passport strategies) with minimal branching in code.
* Self-documenting output: render per-feature docs + a tailored README + `NEXT_STEPS.md`.

---

## Template Layout

```
templates/web/
  static/                  # copied verbatim
    base/
      public/
      views/
      .gitignore

  render/                  # EJS-rendered into the project
    base/
      app.ejs
      env.ejs
      README.md.ejs
      utils/
        validate-env.ejs   # friendly .env validation used at app boot
      docs/
        architecture.md.ejs   # user-facing app architecture (Mermaid)

    pg/
      config/database.ejs
      docs/postgres.md.ejs

    session/
      utils/encryption-handler.ejs
      middleware/session-check.ejs
      docs/sessions.md.ejs

    axios/
      docs/axios.md.ejs

    passport/
      config/
        user-store.ejs
        passport-local.ejs
        passport-bearer.ejs
        passport-google-oauth20.ejs
        passport-microsoft-oauth20.ejs
        passport-facebook-oauth20.ejs
        passport-twitter-oauth20.ejs
        passport-linkedin-oauth20.ejs
        passport-steam-oauth20.ejs
        passport-amazon-oauth20.ejs
      routes/
        auth.ejs
        api.ejs               # demo Bearer API router (/api/me)
      utils/
        security.ejs
        ensure-auth.ejs
        ensure-scope.ejs
        token-store.ejs
      views/
        login.ejs
        register.ejs
        partials/header-auth.ejs
      scripts/
        auth-tools.mjs        # CLI helpers for users & tokens (Bearer)
      docs/
        local.md.ejs
        bearer.md.ejs
        google.md.ejs
        microsoft.md.ejs
```

* **static/** contents are copied 1:1.
* **render/** contents are processed with EJS and may reference `options` / `passportStrategies`.

---

## Generator Flow (`generators/web/webgen.js`)

1. **Parse flags / prompts** → normalize booleans; compute `passportStrategies` from `--passport` or interactive choices.
2. **Auto-enable**: selecting any Passport strategy implies `--pg` and `--session`.
3. **Copy static**: `static/base/{public,views,.gitignore}` → project.
4. **Render base**:

   * `base/app.ejs` → `app.js`
   * `base/env.ejs` → `.env`
   * `base/README.md.ejs` → project `README.md`
   * `base/docs/architecture.md.ejs` → `docs/architecture.md`
   * `base/utils/validate-env.ejs` → `utils/validate-env.js`
5. **Axios (optional)**: `axios/docs/axios.md.ejs` → `docs/axios.md`.
6. **Postgres (optional)**:

   * `pg/config/database.ejs` → `config/database.js`
   * `pg/docs/postgres.md.ejs` → `docs/postgres.md`
7. **Sessions (optional)**:

   * `session/utils/encryption-handler.ejs` → `utils/encryption-handler.js` (only when sessions without Passport)
   * `session/middleware/session-check.ejs` → `middleware/session-check.js`
   * `session/docs/sessions.md.ejs` → `docs/sessions.md`
8. **Passport (mapping‑driven)**: for each strategy in `passportStrategies`, render its `config/passport-*.ejs` → `config/passport-*.js` and any **strategy docs** (`passport/docs/*.md.ejs`).

   * If **Bearer**: also render

     * `passport/utils/token-store.ejs` → `utils/token-store.js`
     * `passport/utils/ensure-scope.ejs` → `utils/ensure-scope.js`
     * `passport/routes/api.ejs` → `routes/api.js` (demo `/api/me`)
     * `passport/scripts/auth-tools.mjs` → `scripts/auth-tools.mjs` (chmod `0755` when not dry-run)
     * `passport/docs/bearer.md.ejs` → `docs/bearer-tokens.md`
9. **Shared Passport bits (once when any strategy is enabled)**:

   * `passport/routes/auth.ejs` → `routes/auth.js`
   * `passport/views/{login,register}.ejs` (register only if `local` is selected)
   * `passport/utils/{ensure-auth.ejs,security.ejs}`
   * `passport/config/user-store.ejs` → `config/user-store.js`
10. **package.json**: set `type=module`, scripts (`dev` uses nodemon if present, `start` uses node). If Bearer, add npm helpers:

    * `user:create`, `token:issue`, `token:create` → `scripts/auth-tools.mjs`
11. **Dependencies**: install base + conditional deps (PG, Sessions, Axios, Passport + provider packages, bcrypt, http-bearer, etc.).
12. **Git init**: write `.gitignore` if missing/enrich with defaults, `git init && git add . && git commit`.
13. **NEXT\_STEPS.md**: build via `generators/web/lib/next-steps.js` with **sequential numbering** and a reminder to **restart** after editing `.env`.

---

## Key Implementation Details

* **`PASSPORT_TEMPLATES`** maps strategy → `{ template, out }`. Add new providers by extending this map and adding a `render/passport/config/passport-*.ejs` file.
* **Env validation**: `utils/validate-env.js` is rendered for every project and called early in `app.js` (right after `dotenv.config()`). It groups and prints friendly errors for **Postgres**, **Session**, and **OAuth** keys, then exits with code `1`.
* **Session table**: `connect-pg-simple` can create the `session` table automatically (`createTableIfMissing: true`).
* **Token store**: `utils/token-store.js` lazily creates `api_tokens` and stores **SHA‑256 hashes only**. Column `user_id TEXT` allows either UUIDs or other id types.
* **`ensure-scope`**: minimal Express middleware to enforce scopes on Bearer‑protected routes; pairs with `passport-http-bearer`.
* **View locals**: a single middleware seeds `res.locals` (**after session + passport**, **before routes**) so EJS includes (like `partials/header`) always see `authEnabled`, `currentUser`, `passportStrategies`, and a `flash` helper.
* **Mermaid**: quote labels containing commas or slashes in diagrams (e.g., `R["/login, /register"]`).

---

## Adding a New Passport Strategy

1. Add an entry to `PASSPORT_TEMPLATES`.
2. Create `templates/web/render/passport/config/passport-<name>.ejs`.
3. Update `app.ejs` to conditionally import/init the strategy.
4. If the strategy needs more files (routes, utils, docs), render them in the `for (const strat of passportStrategies)` loop.
5. Add a doc under `templates/web/render/passport/docs/`.
6. Add its npm dep(s) and update the deps block.

---

## Releasing Changes Safely

* Keep the generator **idempotent**; re-runs shouldn’t crash if files exist.
* Use **conditional doc links** (only link to what was rendered).
* Prefer stable defaults in `.env` and explicitly note that users must **restart** the dev server after editing `.env`.

---

## Troubleshooting

* **EJS header complains `authEnabled` is undefined** → Ensure the "view locals seeding" middleware is mounted **before** any routes render views.
* **Missing PG password (or other env) on startup** → `validate-env` prints a clear, grouped error and exits. Set `.env` and restart.
* **Bearer test fails with UUID error** → either issue a token for a real user id from `users` or rely on `user_id TEXT` (default) which accepts non-UUID ids.
* **Mermaid parse errors** → quote labels with commas/slashes or HTML; prefer `\n` or `<br/>` for line breaks.
