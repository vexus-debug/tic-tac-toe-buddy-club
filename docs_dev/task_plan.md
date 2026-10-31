# Task: Phase 3 — Regulatory Compliance & Clinical Quality (ISO 13485 / 21 CFR 820)

Skills applied: ai-maestro/planning, productivity/brainstorming (scope taken from the agreed Phase 3 brief; user asked for no questions), development/senior-architect, development/code-reviewer, database/supabase-postgres-best-practices.

## Phases
- [x] Phase 1: Research existing QC, remake, traveler and file storage code
- [x] Phase 2: Design (no schema change — reuse lab_records + lab-case-files bucket)
- [x] Phase 3: Implement rules (src/lib/labConformity.ts)
- [x] Phase 4: Implement UI (material lots, QC defect photos, conformity print, dentist scorecard)
- [x] Phase 5: Tests (src/test/lab-phase3.test.ts)

## Decisions
| Decision | Rationale | Date |
|----------|-----------|------|
| Material lots stored as lab_records kind "material_lot" with case_id | Existing org-scoped RLS table; no migration needed; gives recall lookup by lot | 2026-10-30 |
| Defect photos stored in lab-case-files bucket under `<org>/<case>/qc_*`, paths saved in QC record data | Bucket + org-folder policies already exist; photos visible in case files for rework | 2026-10-30 |
| Conformity statement blocked until QC passed and at least one valid lot is bound | A custom-made device statement must list materials and a release inspection | 2026-10-30 |
| Dentist scorecard counts clinic-fault remakes only, per prescribing doctor of the original case | Lab-fault remakes are not the dentist's impression quality | 2026-10-30 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
