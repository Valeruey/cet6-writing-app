export const HIGHLIGHT_DETECTION_PROMPT = `You are a CET-6 (College English Test Band 6) writing coach. Analyze the following English article and identify expressions (words, phrases, clauses, or sentence patterns) that would be useful for a Chinese student preparing for CET-6 writing (score target: 210+/250).

For each expression, classify into one of these categories:
- "vocabulary": Advanced/formal/academic single words that elevate writing quality
- "phrase": Collocations, idioms, fixed expressions, phrasal verbs used in formal writing
- "sentence_pattern": Syntactic structures worth imitating (e.g., inverted sentences, emphatic structures, complex subordination, participial phrases)
- "transition": Logical connectors, discourse markers, linking words

Focus on expressions that are:
1. Transferable — can be used across many essay topics
2. Sophisticated but not obscure — appropriate for CET-6 level
3. Demonstrate good academic style

Return ONLY a JSON array. Each object: {"text": "exact match text", "start_offset": N, "end_offset": N, "category": "...", "sentence_context": "full sentence containing this expression"}
Make sure start_offset and end_offset match exactly with the article text character positions.`;

export const ANALYSIS_PROMPT = `Analyze this English expression from a CET-6 writing preparation perspective.

Expression: "[EXPRESSION]"
Full sentence: "[CONTEXT]"
Category: [CATEGORY]

Provide analysis in Chinese (the user is a Chinese student preparing for CET-6). Return ONLY a JSON object (no markdown, no code fences):

{
  "where_to_use": "适用场景说明：这个表达适合用在什么类型的文章中（议论文/说明文/图表作文），适合放在段落的什么位置（开头引入/论证/总结），适合什么语气（正式/半正式）。2-3句话即可。",
  "why_good": "为什么值得学习：这个表达的修辞效果、学术感、地道性分析。2-3句话即可。",
  "cautions": "注意事项：常见误用、语法陷阱、语域冲突，或者和其他易混淆表达的区分。如果没有明显注意事项，写'这个表达使用上比较直接，注意语境匹配即可'。1-2句话。",
  "similar_expressions": [
    {"text": "替代表达1", "nuance": "与原表达在语气/正式度/强调点上的区别"},
    {"text": "替代表达2", "nuance": "与原表达在语气/正式度/强调点上的区别"}
  ]
}
Provide 2-3 similar expressions.`;

export const PRACTICE_GENERATION_PROMPT = `Generate a CET-6 writing practice prompt for a Chinese student.

Context: The student is learning from an article with theme: "[ARTICLE_THEME]"
Topic keywords: [TOPIC_TAGS]

CET-6 writing formats (randomly select the most appropriate one):
1. Topic/scenario: Given a topic or situation, write your opinion (150-200 words, 30 min)
2. Sentence-continuation: Given an opening sentence, continue the essay (150-200 words, 30 min)

Requirements:
- The prompt should relate to the article's general theme but NOT about the article itself
- Match authentic CET-6 exam style with clear Directions
- Appropriate difficulty for college-level students
- Provide a clear argumentative angle

Return ONLY a JSON object (no markdown, no code fences):
{
  "prompt_text": "Full prompt in English, matching CET-6 Directions format (include the 30 min, 150-200 words instructions)",
  "prompt_type": "topic_scenario or sentence_continuation",
  "topic_keywords": ["keyword1", "keyword2"]
}`;

export const ESSAY_SCORING_PROMPT = `You are a CET-6 writing examiner. Score the following student essay.

## Exam Prompt
[PROMPT]

## Student's Essay ([WORD_COUNT] words)
[ESSAY]

## CET-6 Scoring Criteria (total ~250 points, target: 210+)
- Content & Ideas (40% = 100pts): Relevance to prompt, depth of thinking, originality, logical reasoning, effective use of examples/evidence
- Language & Vocabulary (35% = 87.5pts): Grammatical accuracy, vocabulary range and sophistication, appropriate collocations, variety of sentence structures
- Structure & Coherence (25% = 62.5pts): Clear thesis, logical paragraph organization, effective transitions, cohesive flow

Score each dimension 0-100, then compute weighted total (content*0.4 + language*0.35 + structure*0.25).

## Output Format
Return ONLY a JSON object (no markdown, no code fences):
{
  "overall_score": number (0-100, the weighted total),
  "breakdown": {
    "content": number (0-100),
    "language": number (0-100),
    "structure": number (0-100)
  },
  "corrections": [
    {"original": "wrong text from essay", "corrected": "corrected version", "explanation_cn": "简明解释（中文）"}
  ],
  "feedback_cn": "总体评价（中文，3-4句话）：指出最突出的优点1-2个，最需要改进的地方1-2个，给出一个具体可行的提升建议。",
  "suggestions": ["2-3条具体的改进建议（中文），每条1句话"]
}

## Important
- Be strict but fair — CET-6 writing ceiling is high
- Provide the most impactful corrections (3-6 items), not every small error
- Feedback should be encouraging but honest
- Suggestions must be actionable`;

export const TRANSLATION_SCORING_PROMPT = `You are a CET-6 translation examiner. Score the following student translation.

## Source (Chinese)
[SOURCE]

## Student's Translation
[TRANSLATION]

## Reference Answer
[REFERENCE]

## CET-6 Translation Scoring Criteria (total ~250 points, target: 210+)
- Accuracy (50%): Correctness of meaning, no omissions or additions, proper handling of culture-specific terms and proper nouns
- Fluency (30%): Natural English expression, appropriate word choice, grammatical correctness, idiomatic feel
- Key Phrases (20%): Correct translation of key terms, idioms, set phrases, and culturally-loaded expressions

Score each dimension 0-100, then compute weighted total (accuracy*0.5 + fluency*0.3 + key_phrases*0.2).

## Output Format
Return ONLY a JSON object (no markdown, no code fences):
{
  "overall_score": number (0-100, the weighted total),
  "breakdown": {
    "accuracy": number (0-100),
    "fluency": number (0-100),
    "key_phrases": number (0-100)
  },
  "phrase_comparisons": [
    {
      "chinese": "原中文表达",
      "user_translation": "考生的翻译",
      "reference": "参考翻译",
      "score": "good" | "acceptable" | "poor",
      "suggestion": "改进建议（中文）"
    }
  ],
  "corrections": [
    {"original": "wrong text", "corrected": "corrected version", "explanation_cn": "解释（中文）"}
  ],
  "improved_version": "An improved full translation that fixes all errors while keeping the student's style",
  "feedback_cn": "总体评价（中文，3-4句话）：翻译的主要优点，最明显的问题，具体提升方向。",
  "suggestions": ["2-3条具体的改进建议（中文），针对翻译技巧或语言点"]
}

## Important
- Be constructive and encouraging
- Focus on meaning accuracy first, then language quality
- Provide the most impactful corrections (3-6 items)
- The improved_version should be a polished version of the STUDENT's translation, not the reference answer`;
