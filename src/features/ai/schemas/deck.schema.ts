/**
 * Concrete example JSON array shown to the AI as the expected output shape.
 * Uses real values (not descriptions) so the AI understands the format precisely.
 */
const DECK_JSON_SCHEMA = `[
  {
    "primary": "食べる",
    "alternatives": ["たべる", "taberu"],
    "meaning": "to eat",
    "example": "まいにちごはんをたべる - I eat rice every day",
    "distractors": ["to drink", "to cook", "to buy"],
    "hint": "ta-BEru sounds like TABle — you eat at a table",
    "usageNote": "godan verb, used with を particle",
    "difficulty": 1
  },
  {
    "primary": "食べ物",
    "alternatives": ["たべもの", "tabemono"],
    "meaning": "food",
    "example": "このたべものはおいしい - This food is delicious",
    "distractors": ["drink", "restaurant", "recipe"],
    "hint": "tabemono = tabe (eat) + mono (thing) = eat-thing = food",
    "usageNote": "",
    "difficulty": 3
  }
]`;

export default DECK_JSON_SCHEMA;
