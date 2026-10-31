# Roadmap

- [x] Redesign the staff page with compact mobile-friendly directory cards.
- [x] Keep Add Staff, help, staff details, status, role, phone, and visible Edit actions.
- [x] Automatically send staff assigned to one sub-branch into that branch after login.
- [x] Verify the redesigned staff directory layout at desktop and phone sizes; branch routing is source-verified because this external login cannot be automated here.
- [x] Retire the installed app's old offline cache so the redesigned staff page replaces the previous layout.
- [x] Create owner, dentist, and receptionist dental dashboard views.
- [x] Add the day card, scrollable KPI strip, sparklines, action-first cards, and daily insight.
- [x] Add the empty-clinic onboarding checklist and odontogram empty state.
- [x] Verify the upgraded dental dashboard at desktop and phone sizes.
- [x] Replace public-page dashboard screenshots with matching snapshots of the current dashboard while leaving tutorial pages unchanged.- [x] Keep the patient locked in the link across chart, treatments, prescriptions, consent and profile.
- [x] One-tap check-in from appointment details and the daily calendar; Start Visit opens the chart.
- [x] Waiting list shortcuts to Chart/Plan/Notes, plus checkout after Done.
- [x] Chart findings can be added to the treatment plan with the catalog price.
- [x] Finish-visit panel: review billables, attach prescriptions, send to billing, book the next visit.

## Dentist flow fixes
- [x] Visit context persists across sidebar navigation
- [x] Start visit syncs appointment + waiting list; Done syncs back
- [x] Finish visit: closes queue, logs extra materials; plan item completion deducts stock
- [x] Consent: auto template + "proceed" prompt
- [x] Global visit bar on lab/estimates/materials/patients
- [x] Profile: Start Visit + Dental chart link
- [x] Appointments: My schedule filter; booking conflict warning
- [x] Chart: plan status markers, surface/material
- [x] Treatments: bulk add; plan -> estimate; estimate accept updates plan
- [x] Prescriptions: presets + diagnosis prefill
- [x] Lab case from visit with prefill
- [x] Visit stepper "Next step"

## Dentist workflow blueprint (zero double-entry)
- [x] Fix 1: "Ready in waiting room" cockpit with Call & Start + chair badge
- [x] Fix 2: Auto-propose procedure from chart condition (partly exists: chart → plan with catalog price)
- [x] Fix 3: In-visit SOAP notes sheet with canned phrases, saved on finish
- [x] Fix 4: Draft invoice on finish + cashier "Ready for payment" queue
- [x] Fix 5: Lab fee to draft invoice; material suggestions per procedure
- [x] Fix 6: Dentist sidebar already clinical-only (shop, expenses, POs, suppliers, website, audit hidden)

## Receptionist fixes
- [x] 1 Paid amounts on invoices
- [x] 2 Walk-in / Check-in in quick-add
- [x] 3 Walk-ins join queue; check-in links booking
- [x] 4 Check in / book after registration
- [x] 5 Hide Shop & patient money from dentists
- [x] 6 One main Finish button
- [x] 7 In-visit notes panel

## Dentist walkthrough
- [x] Rewrite the visit walkthrough to follow the Active Visit bar flow (Consent, Chart, Plan, Rx, Notes, Finish) with click-by-click steps

## Lab Phase 2: Shop floor scanning & bench
- [x] Scanner listener with beep on bench and case board
- [x] Bench work timers (start/pause/resume, saved on Done)
- [x] Bench locked to the signed-in technician; supervisor picker
- [x] Bridge abutment / pontic marking
- [x] Fix timer bug when a start time of 0 was treated as stopped

## Lab Phase 3: Compliance & clinical quality
- [x] Material lots per case + Statement of Conformity print
- [x] QC defect photos saved to case files
- [x] Lot recall search on the Case Board
- [x] Dentist impression scorecard on Reports

## Lab Phase 4.1: Catalogue & stock
- [x] QC queue nesting fix, bench shade recipes, tests, update entry
