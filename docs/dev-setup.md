# 🛠️ Kickstart Node App — Developer Setup

This guide explains how to set up a local development environment for contributing to **kickstart-node-app**.

---

## ✅ Prerequisites

Make sure you have these tools installed:

| Tool    | Version (min)             | Notes / Install                                                |
| ------- | ------------------------- | -------------------------------------------------------------- |
| Node.js | 18.x (20 LTS recommended) | [https://nodejs.org](https://nodejs.org)                       |
| npm     | Bundled with Node         | —                                                              |
| Git     | Any recent version        | [https://git-scm.com](https://git-scm.com)                     |
| VS Code | Optional (recommended)    | [https://code.visualstudio.com](https://code.visualstudio.com) |

> Tip: On Windows, use **Git Bash** or **WSL** for a smoother UNIX-like experience (paths, `chmod`, etc.).

---

## 📦 Clone & Link Locally

Clone the repo and link it for local testing:

```bash
git clone https://github.com/yourname/kickstart-node-app.git
cd kickstart-node-app
npm install
npm link   # exposes `kickstart-node-app` globally for dev
```

You can now run the CLI directly:

```bash
kickstart-node-app --help
```

> Alternative (no global link): `node bin/index.js web my-app` from the repo root.

---

## 🧱 Repository Structure

```
kickstart-node-app
├── bin/
│   └── index.js                     # CLI entry point
├── generators/
│   └── web/
│       ├── lib/
│       │   └── next-steps.js        # builds NEXT_STEPS.md (numbered)
│       └── webgen.js                # main generator logic
├── templates/
│   └── web/
│       ├── static/                  # copied verbatim
│       │   └── base/
│       │       ├── public/
│       │       ├── views/
│       │       └── .gitignore
│       └── render/                  # EJS-rendered templates
│           ├── base/
│           │   ├── app.ejs
│           │   ├── env.ejs
│           │   ├── README.md.ejs
│           │   ├── utils/
│           │   │   └── validate-env.ejs
│           │   └── docs/
│           │       └── architecture.md.ejs
│           ├── pg/
│           │   ├── config/database.ejs
│           │   └── docs/postgres.md.ejs
│           ├── session/
│           │   ├── utils/encryption-handler.ejs
│           │   ├── middleware/session-check.ejs
│           │   └── docs/sessions.md.ejs
│           ├── axios/
│           │   └── docs/axios.md.ejs
│           └── passport/
│               ├── config/
│               │   ├── user-store.ejs
│               │   ├── passport-local.ejs
│               │   ├── passport-bearer.ejs
│               │   ├── passport-google-oauth20.ejs
│               │   ├── passport-microsoft-oauth20.ejs
│               │   ├── passport-facebook-oauth20.ejs
│               │   ├── passport-twitter-oauth20.ejs
│               │   ├── passport-linkedin-oauth20.ejs
│               │   ├── passport-steam-oauth20.ejs
│               │   └── passport-amazon-oauth20.ejs
│               ├── routes/
│               │   ├── auth.ejs
│               │   └── api.ejs
│               ├── utils/
│               │   ├── ensure-auth.ejs
│               │   ├── ensure-scope.ejs
│               │   ├── security.ejs
│               │   └── token-store.ejs
│               ├── views/
│               │   ├── login.ejs
│               │   ├── register.ejs
│               │   └── partials/header-auth.ejs
│               ├── scripts/
│               │   └── auth-tools.mjs
│               └── docs/
│                   ├── local.md.ejs
│                   ├── bearer.md.ejs
│                   ├── google.md.ejs
│                   └── microsoft.md.ejs
├── docs/
│   ├── architecture-generator.md    # contributor-facing generator design
│   └── dev-setup.md                 # this document
├── CHANGELOG.md
├── README.md                        # project (CLI) readme
├── package.json
└── .gitignore
```

**Conventions**

* `static/` → files copied 1:1.
* `render/` → EJS processed with `options` + `passportStrategies` from the CLI.
* New Passport providers: add template(s) under `render/passport/config`, update `PASSPORT_TEMPLATES` and deps in `webgen.js`.

---

## 🧪 Develop & Test Locally

### 1) Make your changes

* Update `webgen.js`, templates under `templates/web/render`, docs, etc.
* If you add new files, keep the directory layout consistent.

### 2) Re-link (if needed)

If you changed executable entry points:

```bash
npm link
```

### 3) Generate a test app

Use flags or interactive mode.

**Interactive example**

```bash
kickstart-node-app web my-app
```

**Flags examples**

```bash
# Local + Google (Passport auto-enables pg+session)
kickstart-node-app web my-app --pg --session --passport local,google --port 4001 --silent

# Microsoft + Bearer (renders token-store, ensure-scope, api router, helper scripts)
kickstart-node-app web api-demo --passport microsoft,bearer --port 4002 --silent
```

Useful dev flags:

* `--answers-file ./path/to/answers.json` for reproducible non-interactive runs
* `--dry-run` to print planned actions without writing files
* `--verbose` to see template roots, options, and extra logging

### 4) Run the generated app

```bash
cd my-app
npm install
npm run dev   # or: npm start
```

* Edit `.env` and **restart** the server to apply changes (OAuth keys, PG creds, etc.).
* If you selected Bearer, helper scripts are available:

  * `npm run user:create`
  * `npm run token:issue`
  * `npm run token:create`

---

## 🔎 Debugging Tips

* **EJS header complains `authEnabled` undefined** → Ensure the "view locals seeding" middleware is mounted **after session+passport** and **before routes** (see `app.ejs`).
* **PG env errors on boot** → `utils/validate-env.js` prints grouped diagnostics and exits. Fill `.env` then restart.
* **Bearer token tests fail** → ensure you issued a token for an existing user id; `api_tokens.user_id` is `TEXT` to accommodate non-UUID ids.
* **Windows + chmod** → we `chmod 0755` on `scripts/auth-tools.mjs` (no-op if it fails on Windows; errors are swallowed).

---

## 🧹 Clean Up

To remove the global link:

```bash
npm unlink -g kickstart-node-app
```

To unlink from a generated project:

```bash
npm unlink kickstart-node-app
```

Remove a test app folder as usual:

```bash
rm -rf my-app
```

---

## 📐 Style & Contributions

* Keep the generator **idempotent** (re-running shouldn’t crash if files exist).
* Prefer small, composable templates over giant ones.
* Update [`docs/architecture-generator.md`](./architecture-generator.md) when you change generator flow or template layout.
* Update `CHANGELOG.md` for user-visible changes.
* PRs welcome! 🚀
