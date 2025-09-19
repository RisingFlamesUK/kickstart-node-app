import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { execa } from "execa";
import ejs from "ejs";
import inquirer from "inquirer";
import chalk from "chalk";
import { buildNextStepsMd } from "./lib/next-steps.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Strategy → template filename + output filename
// template: file under templates/web/render/passport/config
// out: file written to <project>/config
const PASSPORT_TEMPLATES = {
  local: { template: "passport-local.ejs", out: "passport-local.js" },
  bearer: { template: "passport-bearer.ejs", out: "passport-bearer.js" },

  // OAuth 2.0 strategies
  google: { template: "passport-google-oauth20.ejs", out: "passport-google-oauth20.js" },
  facebook: { template: "passport-facebook-oauth20.ejs", out: "passport-facebook-oauth20.js" },
  twitter: { template: "passport-twitter-oauth20.ejs", out: "passport-twitter-oauth20.js" },
  microsoft: { template: "passport-microsoft-oauth20.ejs", out: "passport-microsoft-oauth20.js" },
  linkedin: { template: "passport-linkedin-oauth20.ejs", out: "passport-linkedin-oauth20.js" },
  steam: { template: "passport-steam-oauth20.ejs", out: "passport-steam-oauth20.js" },
  amazon: { template: "passport-amazon-oauth20.ejs", out: "passport-amazon-oauth20.js" },
};

const slugify = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Ensure a project .gitignore is present and enriched with required lines.
 */
async function ensureGitignore({ projectDir, STATIC_ROOT }) {
  const destPath = path.join(projectDir, ".gitignore");
  const templatePath = path.join(STATIC_ROOT, "base/.gitignore");
  const defaultLines = [
    ".env",
    "node_modules",
    ".DS_Store",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    "pnpm-debug.log*",
  ];

  const fileExists = async (p) => {
    try {
      return await fs.pathExists(p);
    } catch {
      return false;
    }
  };

  const appendMissing = async () => {
    const current = await fs.readFile(destPath, "utf8").catch(() => "");
    const set = new Set(
      current
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    );
    for (const line of defaultLines) {
      if (!set.has(line)) {
        await fs.appendFile(destPath, (current.endsWith("\n") ? "" : "\n") + line + "\n");
      }
    }
  };

  if (!(await fileExists(destPath)) && (await fileExists(templatePath))) {
    await fs.copy(templatePath, destPath);
    await appendMissing();
    return;
  }
  if (await fileExists(destPath)) {
    await appendMissing();
    return;
  }
  await fs.writeFile(destPath, `${defaultLines.join("\n")}\n`);
}

export default async function runWebGenerator(projectName, options) {
  const projectDir = path.isAbsolute(projectName)
    ? path.normalize(projectName)
    : path.join(process.cwd(), projectName);

  const TEMPLATES_ROOT = path.resolve(__dirname, "../../templates/web");
  const STATIC_ROOT = path.join(TEMPLATES_ROOT, "static");
  const RENDER_ROOT = path.join(TEMPLATES_ROOT, "render");

  // Centralized path helpers (keeps call sites clean)
  const PATHS = {
    projectDir,
    templates: { root: TEMPLATES_ROOT, static: STATIC_ROOT, render: RENDER_ROOT },
    out: (rel) => path.join(projectDir, rel),
    tpl: (rel) => path.join(RENDER_ROOT, rel),
    static: (rel) => path.join(STATIC_ROOT, rel),
  };

  if (options.verbose) {
    console.log(chalk.gray("🧭 Template roots:"));
    console.log(chalk.gray("   STATIC_ROOT:"), STATIC_ROOT);
    console.log(chalk.gray("   RENDER_ROOT:"), RENDER_ROOT);
  }

  // pre-seed interactive answers from file (for tests)
  if (options.answersFile) {
    const answersPath = path.isAbsolute(options.answersFile)
      ? options.answersFile
      : path.join(process.cwd(), options.answersFile);
    const seeded = await fs.readJson(answersPath);
    for (const [k, v] of Object.entries(seeded)) {
      if (options[k] === undefined) options[k] = v;
    }
    if (options.silent === undefined) options.silent = true;
  }

  // Now coerce booleans AFTER merging
  const bool = (v) => (v === undefined ? false : Boolean(v));
  options.pg = bool(options.pg);
  options.session = bool(options.session);
  options.axios = bool(options.axios);
  options.dryRun = bool(options.dryRun);
  options.verbose = bool(options.verbose);
  options.silent = bool(options.silent);

  // verify existence before copying
  const requiredStaticDirs = [
    PATHS.static("base/public"),
    PATHS.static("base/views"),
  ];
  for (const dir of requiredStaticDirs) {
    if (!(await fs.pathExists(dir))) {
      throw new Error(
        `Template folder missing: ${dir}\n` +
          `Make sure your linked package contains templates/web/static/base/{public,views}.`
      );
    }
  }

  const projSlug = slugify(projectName || "app");

  console.log(chalk.cyan.bold(`\n🚀 Kickstart Node — Create a ready-to-run Node.js web project\n`));
  if (options.verbose) {
    console.log(chalk.gray("🔍 Debug options:"), chalk.yellow(JSON.stringify(options, null, 2)));
  }
  console.log(chalk.cyan.bold(`📁 Creating new project: ${projectName}\n`));

  // Normalize + auto-enable first
  const passportRequested =
    (typeof options.passport === "string" && options.passport.trim().length > 0) ||
    (Array.isArray(options.passportChoices) && options.passportChoices.length > 0) ||
    options.usePassport === true;

  if (passportRequested && (!options.pg || !options.session)) {
    console.log(chalk.yellow("ℹ️  Passport selected — enabling PostgreSQL and sessions."));
    options.pg = true;
    options.session = true;
  }

  // Guard any remaining odd combos
  if (options.session && !options.pg) {
    console.log(chalk.yellow("ℹ️  Sessions require PostgreSQL — enabling PostgreSQL."));
    options.pg = true;
  }

  // Build passportStrategies from either --passport string OR preset passportChoices
  let passportStrategies = [];
  if (typeof options.passport === "string" && options.passport.trim()) {
    passportStrategies = options.passport
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  if (passportStrategies.length === 0 && Array.isArray(options.passportChoices) && options.passportChoices.length) {
    passportStrategies = options.passportChoices.map((s) => String(s).toLowerCase());
  }
  // De-dup + normalize
  passportStrategies = [...new Set(passportStrategies.map((s) => s.trim().toLowerCase()))];

  // Interactive prompts only if NOT silent
  if (!options.silent) {
    if (!options.pg && !options.session && !options.axios && passportStrategies.length === 0) {
      const answers = await inquirer.prompt([
        { type: "confirm", name: "pg",      message: chalk.yellow("Include PostgreSQL?"),         default: false },
        { type: "confirm", name: "session", message: chalk.yellow("Enable session management?"),  default: false, when: (a) => a.pg },
        { type: "confirm", name: "axios",   message: chalk.yellow("Include Axios?"),              default: false },
        { type: "confirm", name: "usePassport", message: chalk.yellow("Use Passport.js authentication?"), default: false },
        {
          type: "checkbox",
          name: "passportChoices",
          message: chalk.yellow("Select Passport strategies to include:"),
          when: (a) => a.usePassport,
          choices: [
            { name: "local", value: "local" },
            { name: "bearer", value: "bearer" },
            { name: "google", value: "google" },
            { name: "facebook", value: "facebook" },
            { name: "twitter", value: "twitter" },
            { name: "microsoft", value: "microsoft" },
            { name: "linkedin", value: "linkedin" },
            { name: "steam", value: "steam" },
            { name: "amazon", value: "amazon" },
          ],
        },
      ]);
      Object.assign(options, { pg: answers.pg, session: answers.session, axios: answers.axios });

      if (answers.usePassport) {
        options.pg = true;
        options.session = true;
      }
      if (answers.usePassport && Array.isArray(answers.passportChoices)) {
        passportStrategies = [...new Set(answers.passportChoices.map((s) => s.toLowerCase()))];
      }
    }

    // If PG selected, ensure credentials (ask only for missing ones)
    if (options.pg) {
      const missing = ["pgUser", "pgPassword", "pgDatabase", "pgHost", "pgPort"].filter((k) => !options[k]);
      if (missing.length > 0) {
        const pgAnswers = await inquirer.prompt([
          { type: "input",    name: "pgUser",     message: "Postgres username:",       default: options.pgUser || "postgres", when: () => !options.pgUser },
          { type: "password", name: "pgPassword", message: "Postgres password:",       mask: "*",                              when: () => !options.pgPassword },
          { type: "input",    name: "pgDatabase", message: "Postgres database name:",  default: options.pgDatabase || projSlug, when: () => !options.pgDatabase },
          { type: "input",    name: "pgHost",     message: "Postgres host:",           default: options.pgHost || "localhost", when: () => !options.pgHost },
          { type: "input",    name: "pgPort",     message: "Postgres port:",           default: options.pgPort || "5432",      when: () => !options.pgPort },
        ]);
        Object.assign(options, pgAnswers);
      }
    }
  } else {
    // --silent defaults
    if (options.pg) {
      options.pgUser = options.pgUser || "postgres";
      options.pgHost = options.pgHost || "localhost";
      options.pgPort = options.pgPort || "5432";
      options.pgDatabase = options.pgDatabase || projSlug;
      options.pgPassword = options.pgPassword || "";
    }
  }

  const dry = options.dryRun;
  const logStep = (msg) => console.log(chalk.gray(`⏳ ${msg}${dry ? " [skipped]" : ""}`));

  // ---------------------------
  // Static copies
  // ---------------------------
  const staticPairs = [
    ["base/public", "public"],
    ["base/views", "views"],
  ];
  for (const [from, to] of staticPairs) {
    logStep(`Copying static ${from} → ${to}`);
    if (!dry) {
      await fs.copy(PATHS.static(from), PATHS.out(to));
    }
  }

  // ---------------------------
  // Rendered templates
  // ---------------------------
  const renderTemplate = async (srcRel, destRel, data = {}) => {
    const src = PATHS.tpl(srcRel);
    const dest = PATHS.out(destRel);
    try {
      if (!dry) {
        const rendered = await ejs.renderFile(src, data);
        await fs.outputFile(dest, rendered);
      }
    } catch (err) {
      const hint = `${srcRel} → ${destRel}`;
      console.error(chalk.red(`❌ Failed to render ${hint}`));
      console.error(chalk.red(err?.message || err));
      throw err;
    }
  };

  // ---------------------------
  // Base files
  // ---------------------------
  logStep("Rendering base files...");
  await renderTemplate("base/README.md.ejs", "README.md", {
    appName: projectName,
    port: options.port || "3000",
    passportStrategies,
    usePg: !!options.pg,          // fixed
    useSession: !!options.session,
    useAxios: !!options.axios,
  });

  await renderTemplate("base/utils/validate-env.ejs", "utils/validate-env.js", {
    usePg: !!options.pg,
    passportStrategies,
    port: options.port || "3000",
  });

  await renderTemplate("base/docs/architecture.md.ejs", "docs/architecture.md", { 
    port: options.port || "3000", passportStrategies }
);

  await renderTemplate("base/app.ejs", "app.js", {
    usePg: options.pg,
    useSession: options.session,
    usePassport: passportStrategies.length > 0,
    passportStrategies,
    port: options.port || "3000",
  });

  await renderTemplate("base/env.ejs", ".env", {
    port: options.port || "3000",
    usePg: !!options.pg,
    pgUser: options.pgUser || "",
    pgPassword: options.pgPassword || "",
    pgDatabase: options.pgDatabase || "",
    pgHost: options.pgHost || "",
    pgPort: options.pgPort || "",
    useSession: !!options.session,
    usePassport: passportStrategies.length > 0,
    passportStrategies,
    projectSlug: projSlug,
  });

  // Axios scaffolding
  if (options.axios) {
    logStep("Rendering axios files...");
    await renderTemplate("axios/docs/axios.md.ejs", "docs/axios.md", {});
  }

  // Postgres scaffolding
  if (options.pg) {
    logStep("Rendering pg files...");
    await renderTemplate("pg/config/database.ejs", "config/database.js", {
      useSession: options.session,
    });
    await renderTemplate("pg/docs/postgres.md.ejs", "docs/postgres.md", {
      appName: projectName,
    });
  }

  // Sessions scaffolding
  if (options.session) {
    logStep("Rendering session files...");
    await renderTemplate("session/utils/encryption-handler.ejs", "utils/encryption-handler.js");
    await renderTemplate("session/middleware/session-check.ejs", "middleware/session-check.js", {});
    await renderTemplate("session/docs/sessions.md.ejs", "docs/sessions.md", {});
  }

  // ---------------------------
  // Passport scaffolding (mapping-driven)
  // ---------------------------
  if (passportStrategies.length > 0) {
    logStep("Rendering Passport strategies...");

    for (const strat of passportStrategies) {
      logStep(`Rendering Passport strategy: ${strat}...`);
      const meta = PASSPORT_TEMPLATES[strat];
      if (!meta) {
        console.log(chalk.yellow(`⚠️  Unknown passport strategy "${strat}" — skipping.`));
        continue;
      }

      await renderTemplate(
        path.join("passport/config", meta.template),
        path.join("config", meta.out),
        { port: options.port || "3000" }
      );

      // Bearer-only extras
      if (strat === "bearer") {
        await renderTemplate("passport/utils/token-store.ejs", "utils/token-store.js", {});
        await renderTemplate("passport/utils/ensure-scope.ejs", "utils/ensure-scope.js", {});
        await renderTemplate("passport/routes/api.ejs", "routes/api.js", {});
        await renderTemplate("passport/scripts/auth-tools.ejs", "scripts/auth-tools.mjs", {});

        if (!dry) {
          try {
            await fs.chmod(PATHS.out("scripts/auth-tools.mjs"), 0o755);
          } catch {}
        }

        await renderTemplate("passport/docs/bearer.md.ejs", "docs/bearer-tokens.md", {
          port: options.port || "3000",
        });
      }

      // Strategy-specific docs
      if (strat === "google") {
        await renderTemplate("passport/docs/google.md.ejs", "docs/google-oauth.md", {
          port: options.port || "3000",
        });
      }
      if (strat === "microsoft") {
        await renderTemplate("passport/docs/microsoft.md.ejs", "docs/microsoft-oauth.md", {
          port: options.port || "3000",
        });
      }
      if (strat === "local") {
        await renderTemplate("passport/docs/local.md.ejs", "docs/local-sessions.md", {
          port: options.port || "3000",
        });
      }
    }

    // Render shared user store once (for any passport presence)
    logStep("Rendering user-store.js...");
    await renderTemplate("passport/config/user-store.ejs", "config/user-store.js", {});

    // Always render shared auth route(s)
    await renderTemplate("passport/routes/auth.ejs", "routes/auth.js", { passportStrategies });

    // Always render login page
    await renderTemplate("passport/views/login.ejs", "views/login.ejs", { passportStrategies });

    // Always render the utils
    await renderTemplate("passport/utils/ensure-auth.ejs", "utils/ensure-auth.js", {});
    await renderTemplate("passport/utils/security.ejs", "utils/security.js", {});

    // When auth exists, overwrite the base header with the auth-aware header
    await renderTemplate("passport/views/partials/header-auth.ejs", "views/partials/header.ejs", {
      passportStrategies,
    });

    // Render register page if local passport strategy supported
    if (passportStrategies.includes("local")) {
      await renderTemplate("passport/views/register.ejs", "views/register.ejs", {});
    }
  }

  // ---------------------------
  // Dependencies (deduped)
  // ---------------------------
  const depsSet = new Set(["express", "dotenv", "ejs"]);
  if (options.pg) depsSet.add("pg");
  if (options.session) depsSet.add("express-session").add("connect-pg-simple");
  if (options.axios) depsSet.add("axios");
  if (passportStrategies.length > 0) {
    depsSet.add("passport").add("bcrypt");
    if (passportStrategies.includes("local")) depsSet.add("passport-local");
    if (passportStrategies.includes("bearer")) depsSet.add("passport-http-bearer");
    if (passportStrategies.includes("google")) depsSet.add("passport-google-oauth20");
    if (passportStrategies.includes("facebook")) depsSet.add("passport-facebook");
    if (passportStrategies.includes("twitter")) depsSet.add("passport-twitter");
    if (passportStrategies.includes("microsoft")) depsSet.add("passport-microsoft");
    if (passportStrategies.includes("linkedin")) depsSet.add("passport-linkedin-oauth2");
    if (passportStrategies.includes("steam")) depsSet.add("passport-steam");
    if (passportStrategies.includes("amazon")) depsSet.add("passport-amazon");
  }
  const deps = [...depsSet].sort();

  console.log(chalk.gray("\n📦 Dependencies to install:"));
  console.log(chalk.magentaBright("→"), deps.join(", "));

  // npm init & scripts
  if (!dry) {
    logStep("Initializing npm...");
    await execa("npm", ["init", "-y"], { cwd: projectDir });

    logStep("Patching package.json...");
    const pkgPath = PATHS.out("package.json");
    const pkgJson = await fs.readJson(pkgPath);
    pkgJson.type = "module";
    pkgJson.scripts = pkgJson.scripts || {};

    // Try to use nodemon if available; otherwise just node
    const nodemonAvailable = await isNodemonAvailable();
    pkgJson.scripts.dev = nodemonAvailable ? "nodemon app.js" : "node app.js";
    pkgJson.scripts.start = pkgJson.scripts.start || "node app.js";

    // add token helpers only if bearer is selected
    if (passportStrategies.includes("bearer")) {
      pkgJson.scripts["user:create"] = "node scripts/auth-tools.mjs create-user";
      pkgJson.scripts["token:issue"] = "node scripts/auth-tools.mjs issue-token";
      pkgJson.scripts["token:create"] = "node scripts/auth-tools.mjs create-and-token";
    }

    await fs.writeJson(pkgPath, pkgJson, { spaces: 2 });

    logStep("Installing dependencies...");
    await execa("npm", ["install", ...deps], { cwd: projectDir, stdio: "inherit" });
  }

  // Git
  if (!dry) {
    logStep("Preparing .gitignore...");
    await ensureGitignore({ projectDir, STATIC_ROOT });

    logStep("Initializing Git...");
    await execa("git", ["init"], { cwd: projectDir });
    await execa("git", ["add", "."], { cwd: projectDir });
    await execa("git", ["commit", "-m", "Initial commit"], { cwd: projectDir });
  }

  // Post-gen checklist
  const checklist = [];
  if (options.pg && !options.pgPassword) {
    checklist.push("Set a value for PG_PASS in .env");
  }
  if (
    passportStrategies.some((s) =>
      ["google", "facebook", "twitter", "microsoft", "linkedin", "steam", "amazon"].includes(s)
    )
  ) {
    checklist.push("Fill in OAuth client IDs/secrets and callback URLs in .env (they are commented placeholders).");
  }
  if (options.session) {
    checklist.push("Optionally set SESSION_SECRET in .env (otherwise a random secret is generated at runtime).");
  }

  // Generate NEXT_STEPS.md
  if (!dry) {
    const nextSteps = buildNextStepsMd({
      projectName,
      port: options.port || "3000",
      options,
      passportStrategies,
    });
    await fs.writeFile(PATHS.out("NEXT_STEPS.md"), nextSteps);
  }

  console.log(
    chalk.greenBright.bold(`\n✅ Project "${projectName}" ${dry ? "ready to generate" : "created successfully!"}\n`)
  );
  if (checklist.length) {
    console.log(chalk.yellow("⚠️  Next steps (required for full functionality):"));
    checklist.forEach((item) => console.log(`  • ${item}`));
    console.log();
  }
  console.log(chalk.gray("👉 Next steps:\n"));
  console.log(`  ${chalk.cyan(`cd ${projectName}`)}`);
  console.log(`  ${chalk.cyan("npm run dev")}`);
}

// Utility: detect global/local nodemon
async function isNodemonAvailable() {
  try {
    await execa("nodemon", ["--version"]);
    return true;
  } catch {
    return false;
  }
}
