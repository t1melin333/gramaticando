<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Use TanStack Start server functions for app APIs and server-only helpers for credential and session handling; browser code must never receive secrets.
- Preserve the six specified domain tables, field names and relationships on the user-approved Cloud PostgreSQL database; do not add schema without authorization.
- Authenticate against `usuario` with salted PBKDF2 hashes and signed HTTP-only cookies using a dedicated session secret.
- Do not register the Supabase Auth bearer attacher in `src/start.ts`: application server functions verify the custom signed cookie, so an additional browser auth client is unnecessary and can break startup during SSR.
- Teachers (`tipo = professor`) get the /professor area to manage their own contents, exercises and alternatives and view answers; students study and answer; administrator sign-in stays disabled. Permission rules live in src/lib/permissoes.ts and are enforced in every server function.
- Fetch educational data from the database, not permanent frontend fixtures; only the three prescribed levels are initially seeded.
