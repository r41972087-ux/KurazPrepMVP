import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Subjects Table
export const subjects = sqliteTable('subjects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  stream: text('stream', { enum: ['NATURAL', 'SOCIAL'] }).notNull(),
  gradeLevel: integer('grade_level').notNull(), // 11 or 12
  icon: text('icon'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Units Table
export const units = sqliteTable('units', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  unitNumber: integer('unit_number').notNull(),
  title: text('title').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Short Notes Table (Supports LaTeX & Markdown)
export const shortNotes = sqliteTable('short_notes', {
  id: text('id').primaryKey(),
  unitId: text('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  contentMarkdown: text('content_markdown').notNull(),
  isHighYield: integer('is_high_yield', { mode: 'boolean' }).notNull().default(false),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Practice Questions Table
export const questions = sqliteTable('questions', {
  id: text('id').primaryKey(),
  unitId: text('unit_id')
    .notNull()
    .references(() => units.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  optionsJson: text('options_json').notNull(), // JSON string: [{ id: string, text: string }]
  correctOptionId: text('correct_option_id').notNull(),
  explanation: text('explanation').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Quiz Attempts Table (Offline first: isSynced = 0 until synced with backend)
export const quizAttempts = sqliteTable('quiz_attempts', {
  id: text('id').primaryKey(),
  userId: text('user_id'), // null for guest attempts
  subjectId: text('subject_id')
    .notNull()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  unitId: text('unit_id'),
  score: real('score').notNull(),
  totalQuestions: integer('total_questions').notNull().default(0),
  correctCount: integer('correct_count').notNull().default(0),
  isSynced: integer('is_synced', { mode: 'boolean' }).notNull().default(false),
  completedAt: text('completed_at').notNull().$defaultFn(() => new Date().toISOString()),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Delta Sync Metadata Table (Per subject content hash)
export const syncMetadata = sqliteTable('sync_metadata', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id')
    .notNull()
    .unique()
    .references(() => subjects.id, { onDelete: 'cascade' }),
  contentHash: text('content_hash').notNull(),
  version: integer('version').notNull().default(1),
  lastUpdated: text('last_updated').notNull().$defaultFn(() => new Date().toISOString()),
});

// Relations
export const subjectsRelations = relations(subjects, ({ many, one }) => ({
  units: many(units),
  quizAttempts: many(quizAttempts),
  syncMetadata: one(syncMetadata, {
    fields: [subjects.id],
    references: [syncMetadata.subjectId],
  }),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [units.subjectId],
    references: [subjects.id],
  }),
  shortNotes: many(shortNotes),
  questions: many(questions),
}));

export const shortNotesRelations = relations(shortNotes, ({ one }) => ({
  unit: one(units, {
    fields: [shortNotes.unitId],
    references: [units.id],
  }),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  unit: one(units, {
    fields: [questions.unitId],
    references: [units.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  subject: one(subjects, {
    fields: [quizAttempts.subjectId],
    references: [subjects.id],
  }),
}));

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = typeof subjects.$inferInsert;

export type Unit = typeof units.$inferSelect;
export type InsertUnit = typeof units.$inferInsert;

export type ShortNote = typeof shortNotes.$inferSelect;
export type InsertShortNote = typeof shortNotes.$inferInsert;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

export type SyncMetadataRecord = typeof syncMetadata.$inferSelect;
export type InsertSyncMetadataRecord = typeof syncMetadata.$inferInsert;
