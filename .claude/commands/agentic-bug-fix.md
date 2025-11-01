## Agentic Bug Fixing

### Objective

You are the facilitator for systematically discovering, reproducing, fixing, and validating bugs using an agentic feedback loop.

### Bug Document Location

Bug details are stored in `temp/current-bug.md`. This is a temporary file that gets deleted after the bug is fixed.

### Phase 1: Discovery & Reproduction

IF `temp/current-bug.md` does NOT exist, then stop and ask user to run the `bug-discover` command to create it.

### Phase 2: Investigation & Fix Loop

1. **Reproduce the bug**
   - Make sure you can reproduce the bug using the steps in the bug document

2. **Investigate Root Cause**
   - Use grep, read files, and analyze the codebase
   - Document findings in "Root Cause Analysis" section
   - Develop a fix strategy and document it in "Fix Strategy" section

3. **Make Sure Server is Stopped**
   - Kill any running servers before making changes

4. **Implement Fix**
   - Use `frontend-coder` agent to implement the fix
   - Provide it with:
     - The bug document location: `temp/current-bug.md`
     - Specific instruction: "Implement the fix according to the Fix Strategy section"

5. **Validate Implementation**
   - Use `implementation-validator` agent to check the fix
   - Provide:
     - Path to bug document: `temp/current-bug.md`
     - Ask to check git diff for latest changes
     - Ask to verify the fix matches the strategy

6. **Test the Fix**
   - Use `web-app-validator` agent to run through reproduction steps and confirm the bug is resolved
   - Provide:
     - Path to bug document: `temp/current-bug.md`
     - Ask to run through reproduction steps and confirm the bug is resolved

7. **Decision Point**
   - **IF validation OR testing FAILS:**
     - Revert all changes: `git checkout -- .`
     - Update "Root Cause Analysis" and "Fix Strategy" with learnings
     - GOTO step 3 (re-implement with updated strategy)

   - **IF validation AND testing PASS:**
     - Mark "Fix Implemented" and "Fix Validated" as complete
     - GOTO Phase 3

### Phase 3: Final Validation & Cleanup

1. **Comprehensive Testing**
   - Run through all reproduction steps multiple times
   - Test edge cases
   - Verify no regressions in related features

2. **Create Git Commit**
   - Write clear commit message:
   ```
   Fix: [Brief description of bug]

   [Detailed explanation of what was wrong and how it was fixed]

   Fixes reproduction steps:
   1. [Step 1]
   2. [Step 2]

   Changes:
   - [File 1]: [What changed]
   - [File 2]: [What changed]
   ```

3. **Cleanup**
   - Move `temp/current-bug.md` to `temp/fixed-bug-<timestamp>.md` with a timestamped filename
   - Report to user:
     - What was fixed

### Important Notes

- **Never skip reproduction steps** - If you can't reproduce it, you can't fix it
- **Revert immediately on failure** - Don't accumulate bad changes
- **Test after every change** - The feedback loop is only effective with validation
- **Document learnings** - Update the bug doc with each discovery
- **Keep iterations small** - Make focused changes, test, iterate

### Recovery from Stuck Loop

If you find yourself stuck after 5 failed attempts:
1. Stop and ask the user for more information
2. Re-examine the root cause analysis
3. Consider if this is actually multiple bugs
4. Suggest pair debugging with the user
