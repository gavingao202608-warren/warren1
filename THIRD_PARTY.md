# Open-source components used by Warren Vehicle Finder

- Fuse.js — https://github.com/krisk/Fuse — Apache-2.0; used for typo-tolerant vehicle search. Copyright/license retained in licenses/Fuse-Apache-2.0.txt and the npm distribution. Numeric constraints stay enforced for fuzzy matches.
- Zod — https://github.com/colinhacks/zod — MIT; used to validate inquiry payloads and consent without coercing strings to booleans. License retained in licenses/Zod-MIT.txt.
- TanStack Table (React v8.21.3) — https://github.com/TanStack/table — MIT; used in the authenticated lead dashboard for filtering, sorting and per-row follow-up actions. License retained in licenses/TanStack-Table-MIT.txt. Version 8 is pinned to the API integrated here.
- IndexNow Action — https://github.com/bojieyang/indexnow-action at 38ddfbd93579a8a44c0dee662121bf9d51098f71 (v3.0.0) — MIT. Its request-construction approach is adapted in lib/indexnow.ts with strict independent-origin checks. The full GitHub Action is not installed; submission runs in the existing app process after inventory sync and skips unchanged sitemap/deployment signatures. Original license retained in licenses/IndexNow-Action-MIT.txt.

These components do not change the source dealer website. IndexNow transmits only public URLs and the public site-verification key, never buyer inquiries or contacts. Other existing package licenses remain in their npm distributions.
