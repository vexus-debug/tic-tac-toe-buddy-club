# Findings — Phase 3

- lab_cases has no free-form data column; only `material` text. Lots need their own rows → lab_records (kind, case_id, data jsonb, org RLS).
- QC submit already atomic via `lab_submit_qc` RPC; p_data is jsonb, so photo paths can ride along.
- Case files live in private bucket `lab-case-files` at `<org>/<case>/…` (CaseFiles component).
- Remake claims: lab_records kind "warranties", data.fault (lab|clinic|material) and data.reason; doctor comes from original case `clinic_doctor_name`.
- Print pattern: printTraveler opens a window with escaped HTML and calls window.print().
