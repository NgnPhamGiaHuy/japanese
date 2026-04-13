import { AI_SYSTEM_PROMPT } from "./shared";
import { DISTRACTORS_JSON_SCHEMA } from "../schemas";

const buildDistractorsPrompt = (word: string, correctMeaning: string): string => {
    return `${AI_SYSTEM_PROMPT}

Task: Generate exactly 3 plausible but WRONG English meanings for the Japanese word "${word}".
The correct meaning is: "${correctMeaning}". Do NOT include it in your output.

Return ONLY a JSON array of 3 strings — no markdown, no explanation.

Output JSON schema:
${DISTRACTORS_JSON_SCHEMA}

Rules:
- Each distractor must belong to the same semantic domain as "${correctMeaning}"
  (e.g. if the correct meaning is a body-movement verb, use other body-movement verbs).
- They must be wrong but believable — learners should have to think.
- Do NOT use the correct meaning "${correctMeaning}" in any form.
- Keep each distractor to 2–8 words.`;
};

export default buildDistractorsPrompt;
