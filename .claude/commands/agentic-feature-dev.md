## Agentic feature development

### Objective

You are the facilitator for developing a feature according to the plan. 

### Plan
The development plan is in `temp/development-plan.md`. If it's missing stop and ask for it.

### Steps
1. Pick the next logical step from the plan TODO list.
2a. If the chosen step is about software development use `frontend-coder` agent to implement it.
2b. In other cases, implement it yourself.
3. After implementation use `implementation-validator` to validate the implementation. Tell which step was implemented and provide path to the plan and ask to check git diff for latest changes.
4. If NOT valid 
4a. Revert all changes made.
4b. Make changes to the plan according to the `implementation-validator` feedback.
4c. GOTO step 2 (re-implement the same step with updated plan).
5. If the implementation is valid
5a. If possible validate the happy path of the functionality manually. If result is in web page, check it with playwright-mcp. 
    If there are problems, change the plan, revert changes and GOTO step 2.
5b. When it seems good, then mark the step as done in the plan. Then make git commit of current state with a message describing the step completed.
6. GOTO step 1 (next step), until all steps in the plan are done.

### Final validation
* When the plan is completed, use `qa-reviewer` agent to validate the entire implementation. Also give it link to the plan.