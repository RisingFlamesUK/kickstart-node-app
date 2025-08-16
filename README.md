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
- 🔑 Optional Passport.js authentication strategies (local, bearer, OAuth providers)  
- ⚙️ Flag-driven CLI **or** fully interactive mode  
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

You can run the CLI in two ways:

### 1. Interactive Mode

Just run:

```bash
kickstart-node-app my-app
```

You’ll be prompted to choose:

- Whether to include PostgreSQL  
- Whether to enable sessions  
- Whether to add Axios  
- Which Passport strategies to scaffold  

### 2. Flags Mode

Pass options directly:

```bash
kickstart-node-app my-app --type web --pg --session --axios
```

#### Options

- `--type <type>`: `web` (default)  
- `--pg`: Add PostgreSQL integration  
- `--session`: Add session support (requires PG)  
- `--axios`: Include Axios for HTTP requests  
- `--port <port>`: Set custom server port (default: 3000)  
- `--passportStrategies <list>`: Comma-separated list of Passport strategies (e.g. `local,google`)  
- `--dry-run`: Simulate without creating files  
- `--verbose`: Show detailed output  

#### Example

```bash
kickstart-node-app book-reviews --pg --session --axios --passportStrategies local,google --port 5000
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
├── routes/
│   └── auth.js              # if Passport enabled
├── config/
│   └── passport-*.js        # one per selected strategy
├── utils/
│   ├── database.js          # if --pg
│   ├── encryption-handler.js# if --session but no passport
│   ├── ensure-auth.js       # if Passport enabled
│   └── token-store.js       # if Bearer strategy enabled
├── queries.sql              # if --pg
└── dev script (nodemon)     # if nodemon is detected
```

---

## 🔑 Passport Strategies

When enabled, Passport strategies are scaffolded into `config/` and `routes/`.

Supported strategies:

- `local`: Local username/password sessions  
- `bearer`: Bearer token auth via DB  
- `google`: Google OAuth2 login  
- `facebook`  
- `twitter`  
- `microsoft`  
- `linkedin`  
- `steam`  
- `amazon`  

Example with flags:

```bash
kickstart-node-app my-app --pg --session --passportStrategies local,google,facebook
```

Or interactively (choose from a checklist).

---

## 👨‍💼 For Contributors

Want to help improve `kickstart-node-app`?

See [`dev-setup.md`](./dev-setup.md) for instructions to run and test locally.

---

## 📬 License & Credits

MIT License  
Made with ❤️ by James Peck  

---

## ⭐️ Support

If this CLI saves you time, please star the repo on GitHub and share it with others!
