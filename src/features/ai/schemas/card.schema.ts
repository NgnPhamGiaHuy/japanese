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
  "hint": "ta-BEru = TABle — the rule at the table is: EAT",
  "usageNote": "godan verb, used with を particle",
  "difficulty": 1,
  "mnemonic": "taberu = TABle RUle — at the table, the rule is: EAT",
  "clozeTemplate": "まいにち___ をたべる - I eat ___ every day"
}`;

export default CARD_JSON_SCHEMA;
