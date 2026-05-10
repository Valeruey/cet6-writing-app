import { v4 as uuid } from "uuid";
import { db } from "./connection";
import { articles, expressions, examTopics } from "./schema";
import { eq } from "drizzle-orm";

const now = new Date().toISOString();

async function seed() {
  const articleId = uuid();

  // Check if already seeded
  const [existing] = await db.select().from(articles).limit(1);
  if (existing) {
    console.log("Database already has data, skipping seed.");
    return;
  }

  const sampleArticle = `The rapid advancement of artificial intelligence has fundamentally transformed the landscape of modern education. While traditional teaching methods have their merits, the integration of AI-powered tools offers unprecedented opportunities for personalized learning. Students can now receive instant feedback on their assignments, engage with adaptive learning platforms, and access educational resources from anywhere in the world.

However, this technological revolution is not without its challenges. Critics argue that over-reliance on AI tools may diminish students' critical thinking abilities and reduce meaningful human interaction in the classroom. Moreover, the digital divide between well-funded and under-resourced schools threatens to widen existing educational inequalities.

At the heart of this debate lies a fundamental question: How can we harness the power of AI while preserving the irreplaceable value of human-centered education? The answer, most experts agree, lies in striking a delicate balance. Technology should serve as a supplement to, rather than a substitute for, traditional pedagogical approaches.

Furthermore, it is worth noting that the most successful educational models are those that adapt to changing circumstances without abandoning core principles. In light of this, educators must be willing to embrace innovation while remaining committed to fostering creativity, empathy, and critical thinking in their students.`;

  await db.insert(articles).values({
    id: articleId,
    title: "The Impact of AI on Modern Education",
    source: "The Economist",
    source_url: "https://www.economist.com/",
    author: "Education Correspondent",
    content: sampleArticle,
    word_count: sampleArticle.split(/\s+/).filter(Boolean).length,
    difficulty: "medium",
    topic_tags: JSON.stringify(["education", "technology", "society"]),
    status: "published",
    created_at: now,
    updated_at: now,
  });

  const sampleExpressions = [
    {
      id: uuid(),
      article_id: articleId,
      text: "has fundamentally transformed the landscape of",
      start_offset: 51,
      end_offset: 98,
      category: "phrase",
      analysis: JSON.stringify({
        where_to_use:
          "适合用于议论文开头或段落引言，描述某个重大变化或影响。可以用于教育、科技、社会变迁等话题。正式程度高，适合学术写作语境。",
        why_good:
          "fundamentally 强调根本性变化，landscape 作为隐喻让表达更生动形象。这是一个可以套用在很多话题上的强力句型开头。",
        cautions: "注意 landscape 后面通常跟 of + 被改变的领域。不要和 fundamentally 连用太频繁以免显得重复。",
        similar_expressions: [
          { text: "has profoundly reshaped the field of", nuance: "同样正式，reshape 更强调改变了形态" },
          { text: "has brought sweeping changes to", nuance: "sweeping changes 强调变化范围广，语气稍弱" },
          { text: "has revolutionized the way we approach", nuance: "revolutionize 强调革命性，语气更强烈" },
        ],
      }),
      sentence_context:
        "The rapid advancement of artificial intelligence has fundamentally transformed the landscape of modern education.",
      created_at: now,
    },
    {
      id: uuid(),
      article_id: articleId,
      text: "While traditional teaching methods have their merits, the integration of",
      start_offset: 103,
      end_offset: 172,
      category: "sentence_pattern",
      analysis: JSON.stringify({
        where_to_use:
          "用于议论文中引入对比或让步观点。While从句承认对方观点的合理性，主句提出自己的更优方案。这是一个非常高频的六级写作句型。",
        why_good:
          "have their merits（有其优点）是一种礼貌的让步方式，显示出批判性思维的平衡性。然后用主句推进到新观点，逻辑转折自然。",
        cautions: "While在这里表示'尽管'而非'当...时候'。主句应包含一个对比性/递进性的观点，而非简单陈述事实。",
        similar_expressions: [
          { text: "Although X has its advantages, Y offers...", nuance: "更直接，让步语气稍弱" },
          { text: "For all the benefits of X, one cannot overlook...", nuance: "更正式，适合议论文强调负面" },
          { text: "Notwithstanding the merits of X, we must consider...", nuance: "极其正式，不适合一般六级写作" },
        ],
      }),
      sentence_context:
        "While traditional teaching methods have their merits, the integration of AI-powered tools offers unprecedented opportunities for personalized learning.",
      created_at: now,
    },
    {
      id: uuid(),
      article_id: articleId,
      text: "offers unprecedented opportunities for",
      start_offset: 198,
      end_offset: 235,
      category: "phrase",
      analysis: JSON.stringify({
        where_to_use:
          "用于议论文中描述某个新事物/新变化带来的积极影响。适用于科技、政策、社会趋势等话题。",
        why_good:
          "unprecedented（前所未有的）是一个高分词汇，展现词汇量。opportunities 比 benefits 更具体，for 后面接名词或动名词。",
        cautions: "unprecedented 后面通常接正面或中性名词，不宜接负面词。注意不要拼错。",
        similar_expressions: [
          { text: "opens up vast possibilities for", nuance: "vast 比 unprecedented 稍弱，但也可接受" },
          { text: "creates unparalleled opportunities for", nuance: "unparalleled 也是高分词，可替换 unprecedented" },
        ],
      }),
      sentence_context:
        "AI-powered tools offers unprecedented opportunities for personalized learning.",
      created_at: now,
    },
    {
      id: uuid(),
      article_id: articleId,
      text: "is not without its challenges",
      start_offset: 306,
      end_offset: 336,
      category: "sentence_pattern",
      analysis: JSON.stringify({
        where_to_use:
          "用于议论文中讨论某个事物的两面性，引出缺点或问题。适合放在文章主体段落的开头作为转折。",
        why_good:
          "双重否定（not without）是一种修辞上比直接说has challenges更优雅的表达方式。显得客观、有分析深度。",
        cautions: "这个结构后面通常跟句号或分号，然后展开具体挑战。不要和there be句型混用。",
        similar_expressions: [
          { text: "is not immune to drawbacks", nuance: "immune to 更有拟人感，语气相似" },
          { text: "comes with its own set of problems", nuance: "更直接，口语化一些" },
          { text: "is a double-edged sword", nuance: "更形象，但略显cliché" },
        ],
      }),
      sentence_context:
        "However, this technological revolution is not without its challenges.",
      created_at: now,
    },
    {
      id: uuid(),
      article_id: articleId,
      text: "At the heart of this debate lies a fundamental question",
      start_offset: 453,
      end_offset: 507,
      category: "sentence_pattern",
      analysis: JSON.stringify({
        where_to_use:
          "用于议论文中的转折或深入分析部分，引出核心问题。这是一个倒装句结构，极具学术感。",
        why_good:
          "完全倒装句（介词短语前置+动词+主语）在六级作文中非常加分。at the heart of 比喻核心，很有文采。",
        cautions: "注意是 lies（谓语）在主语 question 之前。如果主语是复数则用 lie。不要写成 lay。",
        similar_expressions: [
          { text: "Central to this issue is the question of...", nuance: "也是倒装，但没有at the heart of形象" },
          { text: "The crux of the matter is...", nuance: "cux 是高级词汇，非倒装但简洁有力" },
        ],
      }),
      sentence_context:
        "At the heart of this debate lies a fundamental question: How can we harness the power of AI while preserving the irreplaceable value of human-centered education?",
      created_at: now,
    },
    {
      id: uuid(),
      article_id: articleId,
      text: "striking a delicate balance",
      start_offset: 580,
      end_offset: 607,
      category: "phrase",
      analysis: JSON.stringify({
        where_to_use:
          "用于议论文的结论部分，描述需要权衡两方利益或多方因素时。适用于需要给出建议/展望的段落。",
        why_good:
          "striking 和 balance 的搭配非常地道（strike a balance）。delicate 强调了平衡的微妙性，增加了表达的精致度。",
        cautions: "strike a balance 是固定搭配，不能用 hit 或 beat 替换 strike。后面通常接 between A and B。",
        similar_expressions: [
          { text: "achieve a fine balance between", nuance: "更直接，fine 和 delicate 语气接近" },
          { text: "strike a happy medium between", nuance: "happy medium 稍显口语化，适合半正式写作" },
          { text: "walk a fine line between", nuance: "强调风险/困难，语气更紧张" },
        ],
      }),
      sentence_context:
        "The answer, most experts agree, lies in striking a delicate balance.",
      created_at: now,
    },
    {
      id: uuid(),
      article_id: articleId,
      text: "serve as a supplement to, rather than a substitute for",
      start_offset: 615,
      end_offset: 666,
      category: "sentence_pattern",
      analysis: JSON.stringify({
        where_to_use:
          "用于议论文结尾或观点总结部分，强调某个事物应该是补充而非替代。可广泛应用于科技vs传统、新方法vs旧方法等对比话题。",
        why_good:
          "A rather than B 结构清晰、有力。supplement 和 substitute 押头韵（s开头），有修辞效果。表达了一个平衡、理性的立场，很受考官欢迎。",
        cautions: "supplement to (注意介词是to) 和 substitute for (注意介词是for)。两个介词不同，容易出错。",
        similar_expressions: [
          { text: "complement, not replace, traditional methods", nuance: "更简洁，complement比supplement更强调互补" },
          { text: "augment rather than supplant existing approaches", nuance: "augment/supplant 都是更高级词汇" },
        ],
      }),
      sentence_context:
        "Technology should serve as a supplement to, rather than a substitute for, traditional pedagogical approaches.",
      created_at: now,
    },
    {
      id: uuid(),
      article_id: articleId,
      text: "it is worth noting that",
      start_offset: 713,
      end_offset: 738,
      category: "transition",
      analysis: JSON.stringify({
        where_to_use:
          "用于议论文中引入一个重要观点或补充信息，适合放在段落开头或展开论证时。是一个温和的强调句型。",
        why_good:
          "这是一个非常实用的过渡句型，比 simply saying 'note that' 更正式、更有说服力。worth noting 暗示了这个信息很重要但不一定是最核心的。",
        cautions: "it is worth noting that 后面接完整的句子。不要和 it is worth to note 混淆——后者是错误用法。",
        similar_expressions: [
          { text: "It is noteworthy that", nuance: "更简洁，语气相同" },
          { text: "It merits attention that", nuance: "更正式，但不够自然" },
          { text: "One should bear in mind that", nuance: "强调读者应该记住，引导性更强" },
          { text: "It cannot be overlooked that", nuance: "更强调不能忽视，语气更强" },
        ],
      }),
      sentence_context:
        "Furthermore, it is worth noting that the most successful educational models are those that adapt to changing circumstances without abandoning core principles.",
      created_at: now,
    },
    {
      id: uuid(),
      article_id: articleId,
      text: "In light of this",
      start_offset: 780,
      end_offset: 798,
      category: "transition",
      analysis: JSON.stringify({
        where_to_use:
          "用于议论文结论段或论证段落末尾，引出基于前面论述的结论或建议。是'because of this'的正式表达。",
        why_good:
          "in light of 是正式的因果连接词，比 because of 和 due to 更有学术感。this 指代前面的论述，形成自然的逻辑衔接。",
        cautions: "in light of 和 in the light of 都可以，前者更常见。后面接名词或名词短语，不直接接句子。",
        similar_expressions: [
          { text: "Given this situation", nuance: "语气稍弱，更中性" },
          { text: "In view of these considerations", nuance: "更正式，适合长论证后使用" },
        ],
      }),
      sentence_context:
        "In light of this, educators must be willing to embrace innovation while remaining committed to fostering creativity, empathy, and critical thinking in their students.",
      created_at: now,
    },
  ];

  for (const expr of sampleExpressions) {
    await db.insert(expressions).values(expr as any);
  }

  const sampleExamTopics = [
    {
      id: uuid(),
      year: 2023,
      month: 3,
      set_number: 1,
      type: "writing",
      prompt_type: "sentence_continuation",
      prompt_text:
        'Directions: For this part, you are allowed 30 minutes to write an essay that begins with the sentence "People are now increasingly aware of the danger of \'appearance anxiety\' or being obsessed with one\'s looks." You can make comments, cite examples or use your personal experiences to develop your essay. You should write at least 150 words but no more than 200 words.',
      reference_answer: null,
      source_file: "2023年3月英语六级真题（第一套）.docx",
      created_at: now,
    },
    {
      id: uuid(),
      year: 2023,
      month: 3,
      set_number: 1,
      type: "translation",
      prompt_type: null,
      prompt_text:
        "张骞(Zhang Qian)是中国第一个伟大的探险家。他不畏艰险,克服重重困难,两次出使西域,开通了中国同西亚和欧洲的通商关系,将中国的丝和丝织品运往西亚和欧洲,开拓了历史上著名的\"丝绸之路\"。同时,他又将西域的风土人情、地理文化以及特有物种等介绍到中原,极大地开阔了人们的视野。正如历史学家所指出的那样,如果没有张骞出使西域,就不可能有丝绸之路的开辟,也就不会有汉朝同西域或欧洲的文化交流。",
      reference_answer:
        "Zhang Qian was China's first great explorer. Braving dangers and overcoming numerous difficulties, he traveled on two missions to the Western Regions, opening trade relations between China and West Asia and Europe, shipping Chinese silk and silk fabrics to West Asia and Europe, and pioneering the historically renowned Silk Road. At the same time, he introduced the customs, geography, culture, and unique species of the Western Regions to the Central Plains, greatly broadening people's horizons. As historians have pointed out, without Zhang Qian's missions to the Western Regions, there would have been no opening of the Silk Road, nor would there have been cultural exchanges between the Han Dynasty and the Western Regions or Europe.",
      source_file: "2023年3月英语六级真题（第一套）.docx",
      created_at: now,
    },
    {
      id: uuid(),
      year: 2022,
      month: 12,
      set_number: 1,
      type: "writing",
      prompt_type: "topic_scenario",
      prompt_text:
        "Directions: For this part, you are allowed 30 minutes to write an essay on the importance of cultivating a sense of social responsibility. You should write at least 150 words but no more than 200 words.",
      reference_answer: null,
      source_file: "2022年12月英语六级真题.docx",
      created_at: now,
    },
    {
      id: uuid(),
      year: 2022,
      month: 6,
      set_number: 1,
      type: "writing",
      prompt_type: "topic_scenario",
      prompt_text:
        "Directions: For this part, you are allowed 30 minutes to write an essay on how to balance academic study and extracurricular activities. You should write at least 150 words but no more than 200 words.",
      reference_answer: null,
      source_file: "2022年6月英语六级真题.docx",
      created_at: now,
    },
  ];

  for (const topic of sampleExamTopics) {
    await db.insert(examTopics).values(topic as any);
  }

  console.log(`Seeded: 1 article, ${sampleExpressions.length} expressions, ${sampleExamTopics.length} exam topics`);
}

seed();
