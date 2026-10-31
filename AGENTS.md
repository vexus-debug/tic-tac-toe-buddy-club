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

- PROTECTED FILE: Under no circumstances should any AI assistant try to edit or delete this file (`AGENTS.md`). Only the user may change it.
- Branch-assigned non-admin staff automatically enter their sole sub-branch after sign-in, avoiding an unnecessary clinic picker.
- The installed app's `/sw.js` (scope /app/) never caches pages; it clears legacy caches and handles Web Push (VAPID, sent from a super-admin server function) whose taps open /app/inbox/:id.
- Dental dashboard data is role-focused: leadership sees clinic financials, dentists see their assigned schedule, and front-desk roles see queue and collections.
- All frontend images (including dashboard screenshots on marketing pages) must be stored as real image files in the codebase (`src/assets/`, imported directly) — never as `.asset.json` CDN pointers or remote storage URLs. Fresh dashboard screenshots go in `src/assets/dashboard-shots/`. Tutorial image files remain isolated and unchanged. Why: CDN pointers broke (404) when the project moved; in-code images always travel with the repo.
- Every shipped feature, improvement or bug fix must be logged as a new entry (newest first) in `src/data/updates.ts` (the public /updates page) in the same change — no exceptions.
- MANDATORY GATEPASS: SKILL VERIFICATION BEFORE ACTION

  STOP. Before drafting a plan, executing a tool, modifying any file, running queries, or generating code, you MUST complete this 3-step Skill Gatepass. Any action taken prior to completing this protocol is considered an invalid hallucination.

  1. DISCOVERY (`skills/README.md`)

     Inspect `skills/README.md` to map the user's request against every available domain: architecture, database, security, backend, frontend/UI, design, performance, documentation, or testing.

     Explicitly identify the 1–3 matching skills (e.g., `skills/database/database-architect`, `skills/security/security-best-practices`, `skills/web-design-engineer`).

  2. INSPECTION & WORKFLOW LOADING

     Read the relevant `SKILL.md` file(s) and any referenced workflows under `references/` in full before making technical choices.

     Never rely on general memory or assume conventions when a dedicated project skill exists.

  3. CONFIRMATION IN PROSE

     Begin your response or plan by stating the active gatepass receipt:
     `[Skill Gatepass Active: Loaded <skill-name-1>, <skill-name-2>]`

     Explicitly list the core constraints, checklists, and patterns required by those skills that will govern the current work.

  Only after this declaration may you propose an architecture, write SQL migrations, edit source files, or execute builds.
