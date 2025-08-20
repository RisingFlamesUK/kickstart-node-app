# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.0.0] - 2025-08-20
### Added
- Initial stable release 🎉
- CLI command: `kickstart-node-app web <project-name>`
- Interactive and flag-driven modes
- Conditional support for:
  - PostgreSQL (`--pg`)
  - Session management (`--session`)
  - Axios (`--axios`)
- Passport.js authentication strategies:
  - Local (email/password)
  - Google OAuth 2.0
  - Stubs for Bearer (token-based), Facebook, Twitter, Microsoft, LinkedIn, Steam, Amazon
- `.env` file generation with placeholders
- Automatic Postgres + session store setup (`connect-pg-simple`)
- EJS-rendered templates for `views/`, `routes/`, and config files
- Next steps guide (`NEXT_STEPS.md`) with provider setup instructions
- Auto-detects `nodemon` for dev script
- Git initialization with `.gitignore`

---
