# 🛠️ Kickstart Node App — Developer Setup

This guide explains how to set up a local development environment for contributing to **kickstart-node-app**.

---

## ✅ Prerequisites

Make sure you have these tools installed:

| Tool    | Version                  | Install Link                                           |
| ------- | ------------------------ | ------------------------------------------------------ |
| Node.js | >= 18.x                  | [nodejs.org](https://nodejs.org)                       |
| npm     | Comes with Node          | —                                                      |
| Git     | Any recent version       | [git-scm.com](https://git-scm.com)                     |
| VS Code | Optional but recommended | [code.visualstudio.com](https://code.visualstudio.com) |

---

## 📦 Install Locally

Clone the repo and link it for local testing:

```bash
git clone https://github.com/yourname/kickstart-node-app.git
cd kickstart-node-app
npm install
npm link   # makes the CLI available globally
```

Now you can run:

```bash
kickstart-node-app --help
```

---

## 🧱 Project Structure

```
kickstart-node-app
├── bin/
│   └── index.js                # CLI entry point
├── generators/
│   └── web/
│       ├── lib/
│       │   └── next-steps.js   # generates NEXT_STEPS.md guidance
│       └── webgen.js           # main generator logic
├── templates/
│   └── web/
│       ├── render/             # EJS-rendered templates
│       │   ├── base/           # core app + env templates
│       │   ├── passport/       # auth-related config/routes/views
│       │   ├── pg/             # PostgreSQL config
│       │   └── session/        # session-only utilities
│       └── static/             # static files copied as-is
│           └── base/           # base public assets + views
├── dev-setup.md
├── README.md
├── package.json
└── .gitignore
```

* `render/` contains EJS templates processed at generation time.
* `static/` contains base assets (CSS, JS, views) copied directly.
* Passport strategies live under `render/passport/config/`.
* New strategies or utilities should update `webgen.js` and `next-steps.js`.

---

## 🔄 Development Workflow

1. Make changes in `kickstart-node-app`
2. Re-link (`npm link`) if needed
3. Generate a new test project:

   ```bash
   kickstart-node-app web my-app --pg --session --passport local,google
   ```
4. Run and validate the generated app
5. Commit and push to a feature branch

---

## 🤪 Testing

For automated checks of generated projects, use the **kickstart-node-app-testbed** repo.
You can clone it and link it to your local CLI, but it is kept separate from this project.

---

## 🧹 Cleanup

To remove the global link:

```bash
npm unlink -g kickstart-node-app
```

To remove the symlink from a project:

```bash
npm unlink kickstart-node-app
```

---

## 📬 Notes for Contributors

* New templates → `templates/web/render` or `templates/web/static`
* Passport strategies → update `webgen.js` and `next-steps.js`
* Keep output clean and consistent
* PRs welcome 🚀
