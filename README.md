# 🚀 Kickstart Node App

A modular CLI tool to **scaffold modern Node.js projects** — currently focused on **web apps**.

---

## 🧪 Features

* 🏗️ Generate ready-to-run Node.js web projects
* 🧱 Conditional support for EJS, PostgreSQL, and session middleware
* 🌐 Web app boilerplate with Express, optional Axios
* 🐐 PostgreSQL support with `pg` and starter config
* 🔐 Session support using `connect-pg-simple`
* 🔑 Optional Passport.js authentication strategies (local, bearer, OAuth providers)
* ⚙️ Flag-driven CLI **or** fully interactive mode
* ⏰ Detects `nodemon` and creates a dev script
* 📆 Generates `.env` dynamically
* 📁 Organizes templates into `render/` (EJS-rendered) and `static/` (copied)

---

## ⚡️ Quick Start

Run without installation:

```bash
npx kickstart-node-app web my-project
```

Or install globally:

```bash
npm install -g kickstart-node-app
kickstart-node-app web my-project
```

---

## 🤔 Usage

You can run the CLI in two ways:

### 1) Interactive Mode

```bash
kickstart-node-app web my-app
```

You’ll be prompted to choose:

* Whether to include PostgreSQL
* Whether to enable sessions
* Whether to add Axios
* Which Passport strategies to scaffold

### 2) Flags Mode

```bash
kickstart-node-app web my-app --pg --session --axios
kickstart-node-app web my-app --pg --session --passport local,google --port 5000
```

#### Options

* `--pg` — Add PostgreSQL integration
* `--session` — Add session support (requires `--pg`)
* `--axios` — Include Axios for HTTP requests
* `--passport <list>` — Comma-separated list of Passport strategies (e.g. `local,google`)
* `--port <port>` — Set custom server port (default: 3000)
* `--answers-file <path>` — Provide preset answers for non-interactive runs
* `--silent` — Use flags/defaults without prompts
* `--dry-run` — Simulate without creating files
* `--verbose` — Show detailed output

---

## 📁 Generated Project Structure (Web)

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
│   └── auth.js                  # if Passport enabled
├── config/
│   ├── database.js              # if --pg
│   ├── user-store.js            # if Passport enabled
│   └── passport-*.js            # one per selected strategy
├── utils/
│   ├── encryption-handler.js    # if --session but no Passport
│   ├── ensure-auth.js           # if Passport enabled
│   └── token-store.js           # if Bearer strategy enabled
├── NEXT_STEPS.md
└── (nodemon-based dev script if nodemon is detected)
```

---

## 🔑 Passport Strategies

When enabled, Passport strategies are scaffolded under `config/` and auth routes under `routes/`.

Supported strategies:

* `local` — Email/password session login
* `google` — Google OAuth 2.0

Planned strategies:

* `bearer` — Bearer token auth via DB
* `facebook`
* `twitter`
* `microsoft`
* `linkedin`
* `steam`
* `amazon`

Examples:

```bash
kickstart-node-app web my-app --pg --session --passport local
kickstart-node-app web my-app --pg --session --passport google,facebook,bearer
```

Or select them interactively.

---

## 👨‍💼 For Contributors

See [`dev-setup.md`](./dev-setup.md) for instructions to run and test locally.

---

## 📬 License & Credits

MIT License
Made with ❤️ by James Peck

---

## ⭐️ Support

If this CLI saves you time, please star the repo on GitHub and share it with others!
