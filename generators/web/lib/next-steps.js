// generators/web/lib/next-steps.js

// Helper to build per-strategy guidance WITHOUT exposing secrets
function passportStrategySection(strat, port) {
  const cb = (p) => `http://localhost:${port}${p}`;

  switch (strat) {
    case 'google':
      return [
        '### Google',
        '- Create OAuth credentials in the Google Cloud Console (type: **Web application**).',
        `- Authorized redirect URI (dev): \`${cb('/auth/google/callback')}\``,
        '- Review/update these in `.env`:',
        '  - GOOGLE_CLIENT_ID',
        '  - GOOGLE_CLIENT_SECRET',
        '  - GOOGLE_CALLBACK_URL',
        '',
      ].join('\n');

    case 'facebook':
      return [
        '### Facebook',
        '- Create an app at Facebook for Developers.',
        `- Valid OAuth Redirect URI (dev): \`${cb('/auth/facebook/callback')}\``,
        '- Review/update these in `.env`:',
        '  - FACEBOOK_APP_ID',
        '  - FACEBOOK_APP_SECRET',
        '  - FACEBOOK_CALLBACK_URL',
        '',
      ].join('\n');

    case 'twitter':
      return [
        '### Twitter',
        '- Create a Project/App at the Twitter Developer Portal.',
        `- Callback URL (dev): \`${cb('/auth/twitter/callback')}\``,
        '- Review/update these in `.env`:',
        '  - TWITTER_CLIENT_ID',
        '  - TWITTER_CLIENT_SECRET',
        '  - TWITTER_CALLBACK_URL',
        '',
      ].join('\n');

    case 'microsoft':
      return [
        '### Microsoft',
        '- Create an app registration in Azure Portal.',
        `- Redirect URI (web) (dev): \`${cb('/auth/microsoft/callback')}\``,
        '- Review/update these in `.env`:',
        '  - MICROSOFT_CLIENT_ID',
        '  - MICROSOFT_CLIENT_SECRET',
        '  - MICROSOFT_CALLBACK_URL',
        '',
      ].join('\n');

    case 'linkedin':
      return [
        '### LinkedIn',
        '- Create an app in the LinkedIn Developer Portal.',
        `- Authorized redirect URL (dev): \`${cb('/auth/linkedin/callback')}\``,
        '- Review/update these in `.env`:',
        '  - LINKEDIN_CLIENT_ID',
        '  - LINKEDIN_CLIENT_SECRET',
        '  - LINKEDIN_CALLBACK_URL',
        '',
      ].join('\n');

    case 'steam':
      return [
        '### Steam',
        '- Obtain a Steam Web API key.',
        '- Review/update these in `.env`:',
        '  - STEAM_API_KEY',
        `  - STEAM_REALM (e.g. http://localhost:${port})`,
        `  - STEAM_RETURN_URL (e.g. ${cb('/auth/steam/return')})`,
        '',
      ].join('\n');

    case 'amazon':
      return [
        '### Amazon',
        '- Create a Login with Amazon app.',
        `- Allowed Return URL (dev): \`${cb('/auth/amazon/callback')}\``,
        '- Review/update these in `.env`:',
        '  - AMAZON_CLIENT_ID',
        '  - AMAZON_CLIENT_SECRET',
        '  - AMAZON_CALLBACK_URL',
        '',
      ].join('\n');

    case 'bearer':
      return [
        '### Bearer',
        '- API token auth (no browser callback).',
        '- A simple token store utility is included at `utils/token-store.js`.',
        '',
      ].join('\n');

    case 'local':
      return [
        '### Local',
        '- Use the **Register** form at `/register` to create a user.',
        '- Then sign in at `/login` with email + password.',
        '',
      ].join('\n');

    default:
      return '';
  }
}

/**
 * Build NEXT_STEPS.md content
 * Accepts a single object argument to match webgen.js usage:
 *   buildNextStepsMd({ projectName, options, passportStrategies, projSlug })
 */
export function buildNextStepsMd({
  projectName = 'app',
  options = {},
  passportStrategies = [],
  projSlug = 'app',
} = {}) {
  const port = String(options.port || '3000');
  const lines = [];

  lines.push(`# Next Steps`);
  lines.push('');
  lines.push(`Thanks for using **Kickstart Node**! 🚀`);
  lines.push(`Your project **${projectName}** is ready.`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // 1) Environment
  lines.push('## 1) Configure Environment Variables');
  lines.push('Review these keys in `.env` (values may already be set from your flags/prompts):');
  lines.push('');
  lines.push('- **Server**');
  lines.push('  - PORT');
  lines.push('');

  if (options.pg) {
    lines.push('- **PostgreSQL**');
    lines.push('  - PG_USER');
    lines.push('  - PG_PASS');
    lines.push('  - PG_DB');
    lines.push('  - PG_PORT');
    lines.push('  - PG_HOST');
    lines.push('');
  }

  if (options.session) {
    lines.push('- **Session**');
    lines.push('  - SESSION_SECRET (optional; generated at runtime if missing)');
    lines.push('');
  }

  const hasPassport = Array.isArray(passportStrategies) && passportStrategies.length > 0;
  if (hasPassport) {
    lines.push('- **OAuth Providers (if used)**');
    lines.push('  - Ensure your client IDs/secrets and callback URLs match your local dev port.');
    lines.push('  - Update the relevant `*_CLIENT_ID`, `*_CLIENT_SECRET`, and `*_CALLBACK_URL` keys in `.env`.');
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // 2) Database
  lines.push('## 2) Database');
  if (options.pg) {
    lines.push('Make sure Postgres is running and the database exists:');
    lines.push('```bash');
    lines.push(`createdb ${options.pgDatabase || projSlug}`);
    lines.push('```');
    lines.push('');
  } else {
    lines.push('No database selected. You can enable Postgres later and update `.env` accordingly.');
    lines.push('');
  }

  // 3) Passport setup (if any)
  if (hasPassport) {
    lines.push('---');
    lines.push('');
    lines.push('## 3) Passport Strategy Setup');
    // Ensure "local" shows up first if present (it’s the most immediately useful)
    const ordered = [...passportStrategies];
    if (ordered.includes('local')) {
      lines.push(passportStrategySection('local', port));
      for (const s of ordered.filter((x) => x !== 'local')) {
        lines.push(passportStrategySection(s, port));
      }
    } else {
      for (const s of ordered) lines.push(passportStrategySection(s, port));
    }
  }

  // 4) Start server
  lines.push('---');
  lines.push('');
  lines.push('## 4) Start the Dev Server');
  lines.push('```bash');
  lines.push('npm run dev');
  lines.push('```');
  lines.push('');
  lines.push(`Then open http://localhost:${port}`);
  lines.push('');

  return lines.join('\n');
}
