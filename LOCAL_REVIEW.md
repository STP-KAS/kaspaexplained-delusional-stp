# Current local verification

The rebuild has not yet been published. Release requirements are tracked in
`RELEASE-CHECKLIST.md`; rendered findings are in `design/BROWSER-REVIEW.md`.

September 6, 2026, current checkout:

- 29 offline application tests passed, including durable submission recovery.
- V1 artifact isolation and all generated page/alias destinations passed.
- Complete education journeys passed Chromium, Firefox, and WebKit at 390,
  768, and 1440 pixels. Checks cover navigation, appearance persistence,
  network controls, wallet lesson keyboard focus, conflicting spends,
  mining reset, rejected spending rules, money history, search and old links.
- Automatic network playback completed once and stopped in Chromium.
- Both original Moose PDFs match their Git versions byte for byte.
- The frozen V1 final matrix completed at 2026-09-06T14:48:51.021Z: 150 states,
  zero automated findings. Manual page-type review and the final revised
  build page at 320/1440 pixels are documented in `design/BROWSER-REVIEW.md`.

The older review is preserved in `design/history/2026-09-06-prior-review.md`.
It is historical evidence, not a certification of this implementation.

The coordinator subsequently reopened V1 for interview-driven changes.
Targeted homepage/Understand checks passed; a new combined matrix is pending
coordination-interaction integration. The 14:48:51 matrix remains historical
evidence for the earlier frozen artifact.

The new final combined matrix completed at 2026-09-06T15:05:20.693Z:
150 states, zero automated findings. Coordination layouts were manually
inspected at 320/1440 pixels in both themes. The narrow checkbox-label
activation-target correction is recorded in `design/BROWSER-REVIEW.md`.

Latest publication candidate: final wording-pass artifact (15:11:09 UTC)
passed the 150-state matrix at 2026-09-06T15:13:58.938Z. The new opening
was visually inspected at 320px light and 1440px dark, with no actionable
findings.
