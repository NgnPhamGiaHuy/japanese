const CARD_JSON_SCHEMA = `{
  "kanaPrimary": "string — REQUIRED: natural spoken/kana form (e.g. 'たべる', 'おはよう')",
  "kanji": "string — OPTIONAL: romaji for N5/N4 (e.g. 'taberu'), kanji for N3+ (e.g. '食べる'); omit if not useful",
  "furigana": "string — OPTIONAL: hiragana reading; only when kanji field contains kanji characters",
  "meaning": "string",
  "example": "kana sentence - English translation (e.g. りんごをたべる - I eat an apple)",
  "distractors": ["wrong meaning 1", "wrong meaning 2", "wrong meaning 3"],
  "hint": "memorable mnemonic in ≤12 words",
  "usageNote": "brief usage context or empty string",
  "difficulty": 1
}`;

export default CARD_JSON_SCHEMA;
