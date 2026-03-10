# Project Instructions

These instructions apply to the entire repository.

## Database Rules

- Manage database references and generated artifacts through `supabase mcp generate`.
- If the database changes through Supabase MCP, run `supabase mcp generate` after the change.
- Before making database changes through MCP, get user confirmation unless the user has already explicitly approved the change or the change is clearly non-material.
- Separate database domains by schema.
- For this project, use only the project schema for app tables. Do not add project domain tables to `public`.
- Reuse `auth.users` for authentication-related user identity references when needed.
- If a concept, API, library behavior, or usage pattern is ambiguous, verify it with Context7 before implementation.

## Verification Rules

- Do not run `npm run build`, `next build`, or other full production build checks unless the user explicitly asks for a build check in the current conversation.
- Default verification should prefer lightweight checks first, such as targeted diagnostics, lint, static review, and local reasoning about the changed scope.
- If a build would be the most direct way to verify something, stop short of running it and report that it was intentionally skipped unless the user explicitly requested it.
