---
description: Wrap up a completed development phase with proper archiving and documentation
---

You are helping wrap up a completed development phase. Follow these steps:

## Context Required
Ask the user for:
1. **Milestone number** (e.g., M2)
2. **Phase number** (e.g., 1, 2, 3)
3. **Phase name** (e.g., "Foundation", "Mode System")
4. **Completion date** (default: today's date)

## Steps to Execute

### 1. Create Archive Document
Create `temp/M{M}-phase{N}-archive.md` containing:
- Phase goal and status
- All detailed task descriptions and implementations
- Test checklists
- Key implementation details (constants, data structures, etc.)
- Files modified/created
- Git commits made
- Known issues/limitations
- References to other documents

**Extract from:** `temp/development-plan.md` (Phase {N} section)

### 2. Create Completion Report
Create `temp/M{M}-PHASE-{N}-COMPLETE.md` containing:
- Executive summary
- Metrics (tasks completed, code metrics, commits)
- Implementation summary (core features delivered)
- Technical architecture
- Testing results
- Known issues
- Future enhancements (out of scope)
- Lessons learned
- Dependencies
- Documentation created/updated
- Next steps
- Sign-off section

### 3. Update Development Plan
In `temp/development-plan.md`:

a. **Update header:**
   - Change "Current Phase" to next phase number

b. **Add Phase Summary section at top** (after header, before detailed plans):
   ```markdown
   ## Phase Summaries

   ### PHASE {N}: {NAME} ✅ COMPLETE
   **Status:** Complete ({date})
   **Goal:** {phase goal}

   **Key Achievements:**
   - ✅ {achievement 1}
   - ✅ {achievement 2}
   - ✅ {git commits info}

   **Documents:**
   - Archive: `temp/M{M}-phase{N}-archive.md`
   - Completion Report: `temp/M{M}-PHASE-{N}-COMPLETE.md`

   ---
   ```

c. **Remove detailed Phase {N} planning:**
   - Replace all Phase {N} task details with:
     ```markdown
     > **Note:** Phase {N} detailed planning has been archived. See `temp/M{M}-phase{N}-archive.md` for full task details.
     ```

### 4. Update CLAUDE.md
Add references to new documents in "Notable Files and Directories" section:
```markdown
* `temp/M{M}-phase{N}-archive.md`: M{M} phase {N} archive ({Phase Name})
* `temp/M{M}-PHASE-{N}-COMPLETE.md`: M{M} phase {N} completion report
```

### 5. Commit All Documentation
Create git commit with message:
```
Phase {N} complete: {brief description}

- Archive detailed planning to M{M}-phase{N}-archive.md
- Create completion report M{M}-PHASE-{N}-COMPLETE.md
- Update development-plan.md with phase summary
- Update CLAUDE.md with document references

Phase {N} ({Phase Name}) completed successfully.
All {X} tasks validated and committed.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Important Notes
- Use TodoWrite tool to track wrap-up progress
- Ensure all archive content is comprehensive (don't lose details!)
- Phase summary should be concise but informative
- Commit message should reference phase completion

## After Completion
Ask the user if they want to:
1. Continue with the next phase
2. Stop and review
3. Make adjustments

---

**Usage:** `/wrap-up-phase` to start the interactive wrap-up process
