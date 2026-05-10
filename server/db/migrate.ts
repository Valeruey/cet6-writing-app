import { sql } from "./connection";

async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source TEXT,
      source_url TEXT,
      author TEXT,
      content TEXT NOT NULL,
      word_count INTEGER NOT NULL DEFAULT 0,
      difficulty TEXT DEFAULT 'medium',
      topic_tags TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS expressions (
      id TEXT PRIMARY KEY,
      article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      start_offset INTEGER NOT NULL,
      end_offset INTEGER NOT NULL,
      category TEXT,
      analysis TEXT,
      sentence_context TEXT,
      created_at TEXT NOT NULL DEFAULT ''
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS exam_topics (
      id TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      set_number INTEGER NOT NULL DEFAULT 1,
      type TEXT NOT NULL,
      prompt_type TEXT,
      prompt_text TEXT NOT NULL,
      reference_answer TEXT,
      source_file TEXT,
      created_at TEXT NOT NULL DEFAULT ''
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS practice_sessions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      prompt_text TEXT NOT NULL,
      source TEXT,
      exam_topic_id TEXT REFERENCES exam_topics(id),
      user_writing TEXT NOT NULL,
      word_count INTEGER NOT NULL DEFAULT 0,
      score REAL,
      score_breakdown TEXT,
      feedback TEXT,
      corrections TEXT,
      created_at TEXT NOT NULL DEFAULT ''
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_progress (
      id TEXT PRIMARY KEY,
      article_id TEXT REFERENCES articles(id),
      completed INTEGER NOT NULL DEFAULT 0,
      expressions_saved INTEGER NOT NULL DEFAULT 0,
      last_position INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT ''
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS saved_expressions (
      id TEXT PRIMARY KEY,
      expression_id TEXT NOT NULL REFERENCES expressions(id),
      saved_at TEXT NOT NULL DEFAULT '',
      review_count INTEGER DEFAULT 0,
      last_reviewed TEXT
    )
  `;

  // Indexes (CREATE INDEX IF NOT EXISTS is safe to run repeatedly)
  await sql`CREATE INDEX IF NOT EXISTS idx_expressions_article ON expressions(article_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exam_topics_year ON exam_topics(year, month)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_practice_created ON practice_sessions(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_saved_expr ON saved_expressions(expression_id)`;

  console.log("Migration completed successfully.");
}

migrate().catch((e) => {
  console.error("Migration failed:", e.message);
  // Don't exit — tables may already exist
});
