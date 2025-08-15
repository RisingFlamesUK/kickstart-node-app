# 🛠️ Kickstart Node App — Developer Setup

This document helps contributors set up the local development environment for `kickstart-node-app`, a modular CLI to scaffold Node.js web and API projects.
Note that with version 1.0.0, only web application is supported.

---

## ✅ Prerequisites

Make sure you have the following installed:

| Tool    | Version                  | Install Link                                           |
| ------- | ------------------------ | ------------------------------------------------------ |
| Node.js | >= 18.x                  | [nodejs.org](https://nodejs.org)                       |
| npm     | Comes with Node          | —                                                      |
| Git     | Any recent version       | [git-scm.com](https://git-scm.com)                     |
| VS Code | Optional but recommended | [code.visualstudio.com](https://code.visualstudio.com) |

---

## 🚀 Getting Started

1. **Clone the repository**:

```bash
git clone https://github.com/RisingFlamesUK/kickstart-node-app.git
cd kickstart-node-app
```

2. **Install dependencies**:

```bash
npm install
```

3. **Link the CLI tool globally**:

Use `npm link` to simulate global `npx` usage locally:

```bash
npm link
```

Now you can run the CLI anywhere on your system:

```bash
kickstart-node my-app --pg --session --axios --dry-run --verbose
```

---

## 🔭 Project Structure

```bash
kickstart-node-app/
├── bin/
│   └── index.js               # CLI entry point
├── generators/
│   ├── api/
│   │   └── index.js           # API project scaffolder
│   └── web/
│       ├── index.js           # Web project scaffolder
│       └── webgen.js          # Logic for generating web projects
├── templates/
│   ├── api/
│   │   ├── render/
│   │   │   └── base/
│   │   └── static/
│   │       └── base/
│   └── web/
│       ├── static/            # Copied directly into project
│       │   ├── base/
│       │   │   ├── public/
│       │   │   └── views/
│       └── render/            # EJS-rendered templates
│           ├── base/
│           │   ├── app.ejs
│           │   └── env.ejs
│           ├── pg/
│           │   └── utils/
│           │       └── database.ejs
│           └── session/
│               └── utils/
│                   └── encryption-handler.ejs
├── package.json
├── package-lock.json
├── dev-setup.md               # Root development setup guide
└── README.md
```

---

## 🧪 Recommended Tools

- `nodemon` — for rapid development (auto-detected by scaffolder)
- `eslint` — for code linting
- `prettier` — for formatting
- `vitest` or `jest` — for future testing

---

## 🔧 Scripts (optional)

If using any scripts, define them in `package.json`:

```json
"scripts": {
  "start": "node ./bin/index.js",
  "dev": "nodemon ./bin/index.js",
  "lint": "eslint .",
  "format": "prettier --write ."
}
```

---

## 🧼 Unlink the CLI (optional)

To remove the global link when finished:

```bash
npm unlink --global
```

---

## 🤝 Contributing

1. Branch from `main`
2. Follow consistent naming (e.g. `feat/web-scaffold`, `fix/install-error`)
3. Test your changes before pushing
4. Open a Pull Request (PR) with a clear description

---

## 📬 Questions?

Open an issue or contact the maintainer.

## Happy building! 🚀