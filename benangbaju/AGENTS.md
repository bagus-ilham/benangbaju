<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Context & Rules
- **Tech Stack**: Next.js 16 (App Router), Supabase (PostgreSQL), Tailwind CSS v4, TypeScript.
- **Architecture**: Domain-driven design. Keep business logic in `src/modules/`.
- **Testing**: Use Vitest for all unit testing. Aim for high coverage on new features.
- **Commits & PRs**: Link PRs and issues in the `CHANGELOG.md` using the format `([#PR_NUMBER](https://github.com/aulia/benangbaju/pull/PR_NUMBER))`.
- **Security**: All API routes and server actions must validate auth state via `requireAuth` or `requireAdmin`.
