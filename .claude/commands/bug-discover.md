## Bug Discovery

### Objective

Document a bug's symptoms and reproduction steps without fixing it immediately. This creates a bug document that can be used later with `/agentic-bug-fix`.

### Process

1. **Gather Information from User**
   - What is the expected behavior?
   - What is the actual behavior?
   - When does it happen?
   - What steps trigger it?
   - Any error messages or console logs?

2. **Interactive Questioning**
   - Ask clarifying questions
   - Dig deeper into edge cases
   - Identify affected components

3. **Confirm Reproduction**
   - Attempt to reproduce the bug
   - If web app, use playwright-mcp to capture the issue
   - Take screenshots if helpful
   - Document console errors

4. **Create Bug Document**
   - Save to `temp/current-bug.md`
   - Include all gathered information
   - Mark "Discovery" and "Reproduction Confirmed" as complete
   - Leave investigation and fix sections for later

5. **Report to User**
   - Summarize what was documented
   - Confirm reproduction was successful
   - Suggest next steps: "Run /agentic-bug-fix to start fixing this bug"

### Output Format

The bug document should be clear enough that someone else (or another AI agent) could pick it up and fix it without additional context.
