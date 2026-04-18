Act as a backend/frontend integration engineer.

## RULES

- All API/Firebase calls go here
- Centralize data access
- Use consistent naming

---

## STRUCTURE

export const flashcardService = {
  getAll,
  getById,
  create,
  update,
  delete
}

---

## FORBIDDEN

- Calling Firebase in components/hooks