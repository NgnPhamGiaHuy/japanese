/**
 * Concrete example JSON shown to the AI as the expected output shape.
 * Uses real values (not descriptions) so the AI understands the format precisely.
 */
const CARD_JSON_SCHEMA = `{
  "primary": "食べる",
  "alternatives": ["たべる", "taberu"],
  "meaning": "to eat",
  "example": "まいにちごはんをたべる - I eat rice every day",
  "distractors": ["to drink", "to cook", "to buy"],
  "hint": "ta-BEru sounds like TABle — you eat at a table",
  "usageNote": "godan verb, used with を particle",
  "difficulty": 1
}`;

export default CARD_JSON_SCHEMA;
