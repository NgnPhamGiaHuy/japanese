Act as a senior engineer responsible for maintaining a clean, scalable, and production-ready codebase.

## OBJECTIVE

After implementing any feature, refactor, or bug fix:
→ Remove all obsolete, unused, and redundant code

Ensure the codebase remains:
- clean
- minimal
- maintainable

---

## CORE RULE (MANDATORY)

After changes are complete:

→ You MUST scan and remove old logic and unused code

---

## WHAT MUST BE REMOVED

### 1. Dead Code

- Unused variables
- Unused functions
- Unused components
- Unused hooks
- Unused services
- Unused types

---

### 2. Old Logic

- Replaced implementations
- Legacy conditions no longer used
- Old feature flags
- Deprecated flows

---

### 3. Duplicate Logic

- Multiple implementations of same logic
- Redundant utility functions
- Repeated transformations

---

### 4. Unused Imports

- Remove all unused imports
- Ensure imports are minimal and correct

---

### 5. Debug / Temporary Code

- console.log
- temporary flags
- commented-out blocks
- test/debug helpers

---

## DETECTION STRATEGY

You MUST:

1. Trace usage:
   - Check if function/component is referenced anywhere
2. Compare old vs new logic:
   - Identify replaced code paths
3. Identify duplication:
   - Consolidate into single source of truth

---

## SAFE REMOVAL RULE

Before deleting anything:

- Confirm it is NOT used
- Confirm it is NOT required for future flow
- Confirm no side effects depend on it

If unsure:
→ DO NOT remove

---

## STRICT RULES

- Do NOT leave commented-out code
- Do NOT keep "just in case" logic
- Do NOT keep legacy fallback unless required
- Do NOT duplicate logic across files

---

## NEXT.JS SPECIFIC CLEANUP

- Remove unused components from feature folders
- Remove unused hooks/services
- Ensure no orphan files exist in feature structure
- Clean unused routes/pages if deprecated

---

## VALIDATION STEP (MANDATORY)

After cleanup:

→ Run build validation

npm run build

Ensure:
- No broken imports
- No missing references
- No runtime issues

---

## OUTPUT REQUIREMENTS

- Cleaned codebase with no unused logic
- Minimal and maintainable structure
- No redundant or legacy code remaining

---

## FINAL PRINCIPLE

Code that is not used is a liability.

Every line of code must:
→ serve a purpose
→ be actively used

If not:
→ remove it