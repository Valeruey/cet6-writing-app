import { pgTable, text, integer, real } from "drizzle-orm/pg-core";

export const articles = pgTable("articles", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  source: text("source"),
  source_url: text("source_url"),
  author: text("author"),
  content: text("content").notNull(),
  word_count: integer("word_count").notNull().default(0),
  difficulty: text("difficulty").default("medium"),
  topic_tags: text("topic_tags").default("[]"),
  status: text("status").notNull().default("draft"),
  created_at: text("created_at").notNull().default(""),
  updated_at: text("updated_at").notNull().default(""),
});

export const expressions = pgTable("expressions", {
  id: text("id").primaryKey(),
  article_id: text("article_id")
    .notNull()
    .references(() => articles.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  start_offset: integer("start_offset").notNull(),
  end_offset: integer("end_offset").notNull(),
  category: text("category"),
  analysis: text("analysis"),
  sentence_context: text("sentence_context"),
  created_at: text("created_at").notNull().default(""),
});

export const examTopics = pgTable("exam_topics", {
  id: text("id").primaryKey(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  set_number: integer("set_number").notNull().default(1),
  type: text("type").notNull(),
  prompt_type: text("prompt_type"),
  prompt_text: text("prompt_text").notNull(),
  reference_answer: text("reference_answer"),
  source_file: text("source_file"),
  created_at: text("created_at").notNull().default(""),
});

export const practiceSessions = pgTable("practice_sessions", {
  id: text("id").primaryKey(),
  user_id: text("user_id"),
  type: text("type").notNull(),
  prompt_text: text("prompt_text").notNull(),
  source: text("source"),
  exam_topic_id: text("exam_topic_id").references(() => examTopics.id),
  user_writing: text("user_writing").notNull(),
  word_count: integer("word_count").notNull().default(0),
  score: real("score"),
  score_breakdown: text("score_breakdown"),
  feedback: text("feedback"),
  corrections: text("corrections"),
  created_at: text("created_at").notNull().default(""),
});

export const userProgress = pgTable("user_progress", {
  id: text("id").primaryKey(),
  user_id: text("user_id"),
  article_id: text("article_id").references(() => articles.id),
  completed: integer("completed").notNull().default(0),
  expressions_saved: integer("expressions_saved").notNull().default(0),
  last_position: integer("last_position").default(0),
  updated_at: text("updated_at").notNull().default(""),
});

export const savedExpressions = pgTable("saved_expressions", {
  id: text("id").primaryKey(),
  user_id: text("user_id"),
  expression_id: text("expression_id")
    .notNull()
    .references(() => expressions.id),
  saved_at: text("saved_at").notNull().default(""),
  review_count: integer("review_count").default(0),
  last_reviewed: text("last_reviewed"),
  ease_factor: real("ease_factor").default(2.5),
  interval: integer("interval").default(0),
  next_review_at: text("next_review_at"),
});
