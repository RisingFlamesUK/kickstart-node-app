// generators/web/lib/next-steps.js

// Helper to build per-strategy guidance WITHOUT exposing secrets
function passportStrategySection(strat, port) {
  const cb = (p) => `http://localhost:${port}${p}`;

  switch (strat) {
    case "google":
      return [
        "### Google",
        "- Create OAuth credentials in the Google Cloud Console (type: **Web application**).",
        `- Authorized redirect URI (dev): \`${cb("/auth/google/callback")}\``,
        "- Review/update these in `.env`:",
        "  - GOOGLE_CLIENT_ID",
        "  - GOOGLE_CLIENT_SECRET",
        "  - GOOGLE_CALLBACK_URL",
        "",
      ].join("\n");

    case "facebook":
      return [
        "### Facebook",
        "- Create an app at Facebook for Developers.",
        `- Valid OAuth Redirect URI (dev): \`${cb("/auth/facebook/callback")}\``,
        "- Review/update these in `.env`:",
        "  - FACEBOOK_APP_ID",
        "  - FACEBOOK_APP_SECRET",
        "  - FACEBOOK_CALLBACK_URL",
        "",
      ].join("\n");

    case "twitter":
      return [
        "### Twitter",
        "- Create a Project/App at the Twitter Developer Portal.",
        `- Callback URL (dev): \`${cb("/auth/twitter/callback")}\``,
        "- Review/update these in `.env`:",
        "  - TWITTER_CLIENT_ID",
        "  - TWITTER_CLIENT_SECRET",
        "  - TWITTER_CALLBACK_URL",
        "",
      ].join("\n");

    case "microsoft":
      return [
        "### Microsoft",
        "- Supported account types: use `common` for any org/personal accounts, or set your tenant GUID.",
        "- Create an app registration in Azure Portal.",
        `- Redirect URI (web) (dev): \`${cb("/auth/microsoft/callback")}\``,
        "- Review/update these in `.env`:",
        "  - MICROSOFT_CLIENT_ID",
        "  - MICROSOFT_CLIENT_SECRET",
        "  - MICROSOFT_TENANT",
        "  - MICROSOFT_CALLBACK_URL",
        "",
      ].join("\n");

    case "linkedin":
      return [
        "### LinkedIn",
        "- Create an app in the LinkedIn Developer Portal.",
        `- Authorized redirect URL (dev): \`${cb("/auth/linkedin/callback")}\``,
        "- Review/update these in `.env`:",
        "  - LINKEDIN_CLIENT_ID",
        "  - LINKEDIN_CLIENT_SECRET",
        "  - LINKEDIN_CALLBACK_URL",
        "",
      ].join("\n");

    case "steam":
      return [
        "### Steam",
        "- Obtain a Steam Web API key.",
        "- Review/update these in `.env`:",
        "  - STEAM_API_KEY",
        `  - STEAM_REALM (e.g. http://localhost:${port})`,
        `  - STEAM_RETURN_URL (e.g. ${cb("/auth/steam/return")})`,
        "",
      ].join("\n");

    case "amazon":
      return [
        "### Amazon",
        "- Create a Login with Amazon app.",
        `- Allowed Return URL (dev): \`${cb("/auth/amazon/callback")}\``,
        "- Review/update these in `.env`:",
        "  - AMAZON_CLIENT_ID",
        "  - AMAZON_CLIENT_SECRET",
        "  - AMAZON_CALLBACK_URL",
        "",
      ].join("\n");

    case "bearer":
      return [
        "### Bearer",
        "- API token auth (server-to-server, CLI, or SPA fetch). No browser callback.",
        "- Tokens are random and only a **SHA-256 hash** is stored in the DB.",
        "- Optional hardening: set `TOKEN_HASH_PEPPER` in `.env`.",
        "",
        "**Issue a token (CLI):**",
        "- If you enabled Bearer, the project includes helper scripts:",
        "  - Create a user:",
        "    ```bash",
        "    npm run user:create -- --email you@example.com --password P@ssw0rd",
        "    ```",
        "  - Create a token for a user:",
        "    ```bash",
        "    npm run token:issue -- --email you@example.com --scopes read:me --ttl 3600",
        "    ```",
        "",
        "**Call the demo protected endpoint (requires scope `read:me`):**",
        "```bash",
        "curl -H \"Authorization: Bearer <token>\" http://localhost:" + port + "/api/me",
        "```",
        "",
      ].join("\n");

    case "local":
      return [
        "### Local",
        "- Use the **Register** form at `/register` to create a user.",
        "- Then sign in at `/login` with email + password.",
        "",
      ].join("\n");

    default:
      return "";
  }
}

// Build a Docs index that only links to rendered docs for selected features
function docsIndexSection({ options = {}, passportStrategies = [] }) {
  const lines = [];
  const docs = [];

  // We render architecture.md as part of base; safe to always link.
  docs.push({ label: "Architecture & Flows", path: "docs/architecture.md" });

  if (options.pg) docs.push({ label: "PostgreSQL", path: "docs/postgres.md" });
  if (options.session) docs.push({ label: "Sessions", path: "docs/sessions.md" });
  if (options.axios) docs.push({ label: "Axios", path: "docs/axios.md" });

  const has = (s) => Array.isArray(passportStrategies) && passportStrategies.includes(s);
  if (has("local")) docs.push({ label: "Local (email + password)", path: "docs/local-sessions.md" });
  if (has("google")) docs.push({ label: "Google OAuth 2.0", path: "docs/google-oauth.md" });
  if (has("microsoft")) docs.push({ label: "Microsoft OAuth 2.0", path: "docs/microsoft-oauth.md" });
  if (has("bearer")) docs.push({ label: "Bearer Tokens", path: "docs/bearer-tokens.md" });

  if (docs.length === 0) return "";
  lines.push("## 📚 Docs");
  for (const d of docs) lines.push(`- **${d.label}** → \`${d.path}\``);
  lines.push("");
  lines.push("---");
  lines.push("");
  return lines.join("\n");
}

/**
 * Build NEXT_STEPS.md content
 * Accepts a single object argument to match webgen.js usage:
 *   buildNextStepsMd({ projectName, options, passportStrategies, projSlug })
 */
export function buildNextStepsMd({
  projectName = "app",
  options = {},
  passportStrategies = [],
  projSlug = "app",
} = {}) {
  const port = String(options.port || "3000");
  const lines = [];

  // normalize strategies just in case
  const uniqStrats = [...new Set((passportStrategies || []).map((s) => String(s).toLowerCase()))];
  const hasPassport = uniqStrats.length > 0;
  const hasBearer = uniqStrats.includes("bearer");

  // Small helper to number sections
  let step = 1;
  const H2 = (title) => `## ${step++}) ${title}`;

  lines.push(`# Next Steps`);
  lines.push("");
  lines.push(`Thanks for using **Kickstart Node**! 🚀`);
  lines.push(`Your project **${projectName}** is ready.`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Docs index
  const docsIdx = docsIndexSection({ options, passportStrategies: uniqStrats });
  if (docsIdx) lines.push(docsIdx);

  // 1) Env
  lines.push(H2("Configure Environment Variables"));
  lines.push("Review these keys in `.env` (values may already be set from your flags/prompts):");
  lines.push("");
  lines.push("- **Server**");
  lines.push("  - PORT");
  lines.push("");

  if (options.pg) {
    lines.push("- **PostgreSQL**");
    lines.push("  - PG_USER");
    lines.push("  - PG_PASS");
    lines.push("  - PG_DB");
    lines.push("  - PG_PORT");
    lines.push("  - PG_HOST");
    lines.push("");
  }

  if (options.session) {
    lines.push("- **Session**");
    lines.push("  - SESSION_SECRET (optional; generated at runtime if missing)");
    lines.push("");
  }

  if (hasPassport) {
    lines.push("- **OAuth/Passport**");
    lines.push("  - Ensure client IDs/secrets and callback URLs match your local dev port.");
    lines.push("  - Update the relevant `*_CLIENT_ID`, `*_CLIENT_SECRET`, and `*_CALLBACK_URL` keys in `.env`.");
    lines.push("");
  }

  if (hasBearer) {
    lines.push("- **Bearer (optional hardening)**");
    lines.push("  - TOKEN_HASH_PEPPER");
    lines.push("");
  }

  lines.push("> **Note:** After editing `.env`, restart the dev server so changes take effect.");
  lines.push("");
  lines.push("---");
  lines.push("");

  // 2) DB
  lines.push(H2("Database"));
  if (options.pg) {
    lines.push("Make sure Postgres is running and the database exists:");
    lines.push("```bash");
    lines.push(`createdb ${options.pgDatabase || projSlug}`);
    lines.push("```");
    lines.push("");
  } else {
    lines.push("No database selected. You can enable Postgres later and update `.env` accordingly.");
    lines.push("");
  }

  // 3) Auth setup (if any)
  if (hasPassport) {
    lines.push(H2("Authentication Setup"));
    // Local first, then others
    const ordered = uniqStrats.includes("local")
      ? ["local", ...uniqStrats.filter((s) => s !== "local")]
      : uniqStrats;
    for (const s of ordered) lines.push(passportStrategySection(s, port));
  }

  // 4) Bearer quickstart (only if bearer enabled)
  if (hasBearer) {
    lines.push(H2("Bearer: Quickstart (CLI + curl)"));
    lines.push("```bash");
    lines.push("# Create a local user (if needed)");
    lines.push("npm run user:create -- --email you@example.com --password P@ssw0rd");
    lines.push("");
    lines.push("# Issue a token for that user");
    lines.push("npm run token:issue -- --email you@example.com --scopes read:me --ttl 3600");
    lines.push("");
    lines.push("# Call the demo protected endpoint (requires scope read:me)");
    lines.push(`curl -H "Authorization: Bearer <token>" http://localhost:${port}/api/me`);
    lines.push("```");
    lines.push("");
    lines.push("> Tokens are returned once — store them securely. Only a hash is stored in the DB.");
    lines.push("");
  }

  // Start server (this will be step 4 or 5 depending on Bearer)
  lines.push(H2("Start the Dev Server"));
  lines.push("```bash");
  lines.push("npm run dev");
  lines.push("```");
  lines.push("");
  lines.push(`Then open http://localhost:${port}`);
  lines.push("");

  // What's next (final step)
  lines.push("---");
  lines.push("");
  lines.push(H2("What's Next"));
  if (options.session) {
    lines.push("- Add CSRF protection to state-changing form POSTs.");
  }
  if (hasBearer) {
    lines.push("- Add route-level scope checks (e.g., `ensureScope('read:me')`).");
  }
  lines.push("- Add rate limiting to auth endpoints.");
  lines.push("- Keep dependencies up to date.");
  lines.push("");

  return lines.join("\n");
}
