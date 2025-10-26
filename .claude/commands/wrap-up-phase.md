### Cleanup and Archiving
After the phase is complete and QA validated:
1. Create archive document `temp/M{M}-phase{N}-archive.md` with all detailed planning steps from the completed phase and milestone
2. Create completion report `temp/M{M}-PHASE-{N}-COMPLETE.md` with implementation summary, metrics, and results
3. Update `temp/development-plan.md`:
   - Add Phase N Summary section at top with key achievements and status
   - Mark phase as COMPLETE in status line
   - Add references to archive and completion documents
   - Remove detailed planning sections
4. Update CLAUDE.md with references to these document.
5. Commit all documentation with message: "Phase {N} complete: [brief description]"
