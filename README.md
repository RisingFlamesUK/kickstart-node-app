# 🚀 Kickstart Node App

A modular CLI tool to **scaffold modern Node.js projects** — whether you're building a web app, an API, or something in between.

**NOTE: Currently only **`web`** app projects are supported.**

---

## 🧪 Features

- 🏗️ Generate ready-to-run Node.js web projects
- 🧱 Conditional support for EJS, PostgreSQL, and session middleware
- 🌐 Web app boilerplate with Express, optional Axios
- 🐐 PostgreSQL support with `pg` and schema starter
- 🔐 Session support using `connect-pg-simple`
- ⚙️ Flag-driven CLI (no prompts required)
- ⏰ Detects `nodemon` and creates a dev script
- 📆 Generates `.env` dynamically
- 📁 Organizes templates into `render/` (EJS-rendered) and `static/` (copied)

---

## ⚡️ Quick Start

No install required:

```bash
npx kickstart-node-app my-project
```

Or install globally:

```bash
npm install -g kickstart-node-app
kickstart-node-app my-project
```

---

## 🤔 Usage

```bash
kickstart-node-app my-app --type web --pg --session --axios
```

### Options

- `--type <type>`: `web` (default)
- `--pg`: Add PostgreSQL integration
- `--session`: Add session support (requires PG)
- `--axios`: Include Axios for HTTP requests
- `--port <port>`: Set custom server port (default: 3000)
- `--dry-run`: Simulate without creating files
- `--verbose`: Show detailed output

### Example

```bash
kickstart-node-app book-reviews --pg --session --axios --port 5000
```

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
├── utils/
│   ├── database.js           # if --pg
│   └── encryption-handler.js # if --session
├── queries.sql               # if --pg
└── dev script (nodemon)     # if nodemon is detected
```

---

### Passport Strategies

---

You can scaffold passport authentication into your app:

```bash
kickstart-node-app my-app --pg --session --passport local,google
```

Supported strategies:

- `local`: Local username/password sessions
- `bearer`: Bearer token auth via DB
- `google`: Google OAuth2 login
- `facebook`, `twitter`, `microsoft`, `linkedin`, `steam`, `amazon`...

---

## 👨‍💼 For Contributors

Want to help improve `kickstart-node-app`?

See [`dev-setup.md`](./dev-setup.md) for instructions to run and test locally.

---

## 📬 License & Credits

MIT License\
Made with ❤️ by James Peck

---

## ⭐️ Support

If this CLI saves you time, please star the repo on GitHub and share it with others!

