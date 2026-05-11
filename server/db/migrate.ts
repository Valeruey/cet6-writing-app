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
      user_id TEXT,
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
      user_id TEXT,
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
      user_id TEXT,
      expression_id TEXT NOT NULL REFERENCES expressions(id),
      saved_at TEXT NOT NULL DEFAULT '',
      review_count INTEGER DEFAULT 0,
      last_reviewed TEXT,
      ease_factor REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 0,
      next_review_at TEXT
    )
  `;

  // Add columns that may be missing on existing databases
  const addColumn = async (table: string, column: string, colDef: string) => {
    const exists = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = ${table} AND column_name = ${column}
    `;
    if (exists.length === 0) {
      await sql.unsafe(`ALTER TABLE ${table} ADD COLUMN ${column} ${colDef}`);
      console.log(`Added ${table}.${column}`);
    } else {
      console.log(`Skipped ${table}.${column} (already exists)`);
    }
  };

  await addColumn("practice_sessions", "user_id", "TEXT");
  await addColumn("user_progress", "user_id", "TEXT");
  await addColumn("saved_expressions", "user_id", "TEXT");
  await addColumn("saved_expressions", "ease_factor", "REAL DEFAULT 2.5");
  await addColumn("saved_expressions", "interval", "INTEGER DEFAULT 0");
  await addColumn("saved_expressions", "next_review_at", "TEXT");

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_expressions_article ON expressions(article_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exam_topics_year ON exam_topics(year, month)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_practice_created ON practice_sessions(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_saved_expr ON saved_expressions(expression_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_practice_user ON practice_sessions(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_expressions(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id)`;

  console.log("Migration completed successfully.");
}

migrate().catch((e) => {
  console.error("Migration failed:", e.message);
});
