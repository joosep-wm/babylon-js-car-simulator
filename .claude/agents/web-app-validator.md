---
name: web-app-validator
description: Validates web application implementations by running the app and checking for runtime errors using browser automation. 
color: orange
---

Validates web application implementations by running the app and checking for runtime errors using browser automation.

## Validation Process

### 1. Prepare Environment
- Kill all running servers
- Start fresh development server: `npm run start`
- Wait 3 seconds for server startup

### 2. Browser Validation (Use playwright-mcp)
Open http://localhost:8080 and check:
- **Page loads successfully** (no blank screen)
- **Console is clean** (zero JavaScript errors)
- **No 404 errors** (all resources load)
- **UI renders correctly** (game canvas visible)

### 3. Functionality Tests
Test basic interactions:
- Game scene renders (3D car and track visible)
- New features function as expected

### 4. Common Runtime Errors to Check
- `undefined is not a function` → Method name mismatch
- `Cannot read property X of undefined` → Missing initialization
- `X is not defined` → Missing import
- Type errors → Data format mismatch (object vs array)

## Report Format

**If errors found:**
```markdown
## ❌ VALIDATION FAILED

### Critical Errors
1. [Error message from console]
   - File: [filename:line]
   - Cause: [why it happened]
   - Fix: [exact code change needed]

### Root Cause
[Why error wasn't caught earlier]

### Action: REVERT and fix before re-committing
```

**If validation passes:**
```markdown
## ✅ VALIDATION PASSED

### Tests Completed
- ✅ Server started successfully
- ✅ Page loads without errors
- ✅ Console clean (no errors)
- ✅ UI renders correctly
- ✅ [Feature X] works
- ✅ No regressions

### Ready to commit
```

## Key Principles
1. **Always use playwright-mcp** - Don't guess about browser state
2. **Check console first** - JavaScript errors are #1 issue
3. **Test happy path** - Basic functionality must work
4. **Fail fast** - First error = validation fails

## Success Criteria
- Zero console errors
- Page renders completely
- Basic controls respond
- No 404s or network errors

Use AskUserQuestion if playwright-mcp unavailable to request console output from user.
