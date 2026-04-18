Act as a senior engineer performing a strict code review.

## TASK

Analyze the provided code and:

---

## STEP 1 — FIND ISSUES

Identify:

- Architecture violations
- Large files (>200 lines)
- Mixed responsibilities
- Business logic inside components
- API calls outside services
- Bad naming
- Duplication
- Performance risks

---

## STEP 2 — EXPLAIN

For each issue:
- Why it is bad
- What impact it has (scalability, readability, bugs)

---

## STEP 3 — FIX

- Refactor code properly
- Keep behavior unchanged
- Apply clean architecture

---

## OUTPUT FORMAT

1. Issues list
2. Explanation
3. Refactored code

---

## RULE

Be strict. Do not accept “working but messy” code.