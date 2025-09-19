# 🚀 Kickstart Node App

A modular CLI to **scaffold modern Node.js web apps** with Express, EJS, PostgreSQL sessions, and optional Passport strategies (local, Google, Microsoft, Bearer). It renders code **and** feature docs so projects are ready to run and easy to onboard.

---

## ✨ Highlights

* 🏗️ **One command** to generate a ready-to-run web app
* 🔌 **Feature‑gated scaffolding** (PG, Sessions, Axios, Passport strategies)
* 🔑 **Auth out of the box**: Local, Google, Microsoft, Bearer (API tokens)
* 📚 **Docs generated with the app**: architecture, provider guides, sessions, PG, bearer
* 🧪 **Dev helpers**: `session-check` middleware, example `/api/me` when Bearer is enabled
* 🧰 **Auth utilities**: `ensure-auth`, `ensure-scope`, `security` (bcrypt + token hashing)
* 🧾 **NEXT\_STEPS.md** tailored to your selections (with clear, ordered setup)
* 🧯 **Friendly env validation** at startup (`utils/validate-env.js`) with grouped errors
* ⚙️ **Nodemon detection** → `npm run dev` uses nodemon when available

> The generated app includes minimal views and demo routes so you can verify end‑to‑end quickly.

---

## ⚡️ Quick Start

### 1) Interactive Mode

Run directly with **npx** (no install):

```bash
npx kickstart-node-app web my-project
```

Or install globally:

```bash
npm install -g kickstart-node-app
kickstart-node-app web my-project
```

You’ll be prompted to choose:

* PostgreSQL, Sessions, and Axios
* Passport strategies: `local`, `google`, `microsoft`, `bearer`
* Port (optional)

This is ideal when you’re exploring options or scaffolding your first project.

### 2) Flags Mode (declare everything up front)

Skip prompts and declare everything up front.

```bash
# Plain web app with PG + sessions
kickstart-node-app web my-app --pg --session

# Local + Google auth (PG & sessions auto-enabled)
kickstart-node-app web my-app --passport local,google --port 4001

# Microsoft + Bearer (adds token helpers and /api/me demo)
kickstart-node-app web my-app --passport microsoft,bearer
```

> **Note:** Passing `--passport ...` **auto‑enables** `--pg` and `--session`.

---

## 🔧 CLI Options

* `--pg` — Add PostgreSQL integration
* `--session` — Add session support (requires PG; auto‑enabled when Passport is used)
* `--axios` — Include Axios
* `--passport <list>` — Comma‑separated strategies: `local,google,microsoft,bearer`
* `--port <port>` — Server port (default: 3000)
* `--answers-file <path>` — Seeded answers for CI/non‑interactive runs
* `--silent` — No prompts; use flags/defaults
* `--dry-run` — Simulate without writing files
* `--verbose` — Extra logging

Interactive mode (no flags) will prompt for selections.

---

## 📁 What It Generates

```
my-app/
├── app.js
├── .env
├── package.json
├── public/
│   ├── styles/
│   │   └── main.css
│   └── js/
│       └── index.js
├── views/
│   ├── index.ejs
│   └── partials/
│       ├── header.ejs
│       └── footer.ejs
├── routes/
│   ├── auth.js                 # when Passport enabled
│   └── api.js                  # when Bearer enabled (demo /api/me)
├── config/
│   ├── database.js             # when PG enabled
│   ├── user-store.js           # when Passport enabled
│   └── passport-*.js           # per selected strategies
├── utils/
│   ├── validate-env.js         # always (friendly .env checks on boot)
│   ├── encryption-handler.js   # when Sessions but no Passport
│   ├── ensure-auth.js          # when Passport enabled
│   ├── ensure-scope.js         # when Bearer enabled
│   ├── security.js             # when Passport enabled
│   └── token-store.js          # when Bearer enabled (hash-only storage)
├── middleware/
│   └── session-check.js        # when Sessions enabled
├── scripts/
│   └── auth-tools.mjs          # when Bearer enabled (user+token helpers)
├── docs/
│   ├── architecture.md         # always (app architecture & flows)
│   ├── postgres.md             # when PG
│   ├── sessions.md             # when Sessions
│   ├── bearer-tokens.md        # when Bearer
│   ├── google-oauth.md         # when Google
│   ├── microsoft-oauth.md      # when Microsoft
│   └── local-sessions.md       # when Local
└── NEXT_STEPS.md
```

### Bearer extras

* Installs `utils/token-store.js` (lazy‑creates `api_tokens` table; stores **SHA‑256** token hashes only)
* Adds `utils/ensure-scope.js` and demo `routes/api.js` with `GET /api/me`
* Emits helper script `scripts/auth-tools.mjs` and npm scripts:

```jsonc
{
  "scripts": {
    "user:create": "node scripts/auth-tools.mjs create-user",
    "token:issue": "node scripts/auth-tools.mjs issue-token",
    "token:create": "node scripts/auth-tools.mjs create-and-token"
  }
}
```

---

## 📚 Generated Docs

The generator renders docs matching your selections so teams onboard faster:

* `docs/architecture.md` — App architecture & flows (Mermaid diagrams)
* `docs/postgres.md` — PG connection + tips (when `--pg`)
* `docs/sessions.md` — Session store & middleware order (when `--session`)
* `docs/bearer-tokens.md` — Token design, CLI helpers, scopes (when Bearer)
* `docs/google-oauth.md`, `docs/microsoft-oauth.md`, `docs/local-sessions.md` — Per‑strategy guides
* `NEXT_STEPS.md` — Ordered setup checklist (with a reminder to **restart** after editing `.env`)

---

## 🛠️ Templates & Gating (for contributors)

* Templates live under `templates/web/{render,static}`

  * `render/` — EJS templates that interpolate feature flags
  * `static/` — Copied as‑is (assets, base views)
* `generators/web/webgen.js` drives generation

  * Auto‑enables PG + Sessions when any Passport strategy is selected
  * `PASSPORT_TEMPLATES` maps strategy → `config/passport-*.js`
  * Renders feature docs and helper scripts conditionally
  * Emits `utils/validate-env.js` and calls it during app boot

To add a new strategy: drop `passport-*.ejs` under `render/passport/config/`, add to `PASSPORT_TEMPLATES`, and (optionally) add a doc under `render/passport/docs/`.

---

## 🧪 Local Development (this repo)

See [`docs/dev-setup.md`](./docs/dev-setup.md) for contributing instructions.

* Keep **CHANGELOG.md** at repo root up to date per release.
* When changing scaffolding behavior, update the rendered docs and `NEXT_STEPS.md` builder.

---

## 📄 License

MIT

— Made with ❤️ by James Peck
