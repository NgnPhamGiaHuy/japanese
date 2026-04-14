/**
 * Concrete example JSON array shown to the AI as the expected output shape.
 * Uses real values (not descriptions) so the AI understands the format precisely.
 */
const DECK_JSON_SCHEMA = `[
  {
    "kanaPrimary": "たべる",
    "altForm": "taberu",
    "furigana": "",
    "meaning": "to eat",
    "example": "まいにちごはんをたべる - I eat rice every day",
    "distractors": ["to drink", "to cook", "to buy"],
    "hint": "ta-BEru sounds like TABle — you eat at a table",
    "usageNote": "godan verb, used with を particle",
    "difficulty": 1
  },
  {
    "kanaPrimary": "たべもの",
    "altForm": "食べ物",
    "furigana": "たべもの",
    "meaning": "food",
    "example": "このたべものはおいしい - This food is delicious",
    "distractors": ["drink", "restaurant", "recipe"],
    "hint": "tabemono = tabe (eat) + mono (thing) = eat-thing = food",
    "usageNote": "",
    "difficulty": 3
  }
]`;

export default DECK_JSON_SCHEMA;
