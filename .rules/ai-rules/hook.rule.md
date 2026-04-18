Act as a senior engineer designing custom hooks.

## RULES

- One responsibility per hook
- No UI logic
- No API calls (delegate to services)
- No hidden side effects

---

## GOOD

- useFlashcards → fetch logic
- useFlashcardFilter → filtering logic

---

## BAD

- God hooks doing everything