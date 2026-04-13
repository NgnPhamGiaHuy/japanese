const CARD_JSON_SCHEMA = `{
  "kanji": "string",
  "furigana": "string",
  "meaning": "string",
  "example": "string",
  "distractors": ["wrong meaning 1", "wrong meaning 2", "wrong meaning 3"],
  "hint": "memorable mnemonic in ≤12 words",
  "usageNote": "brief usage context or empty string",
  "difficulty": 1
}`;

export default CARD_JSON_SCHEMA;
