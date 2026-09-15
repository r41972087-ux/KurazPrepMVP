import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const DATABASE_NAME = 'kurazprep.db';

// Open synchronous SQLite database connection with Expo SQLite
export const expoDb = openDatabaseSync(DATABASE_NAME);

// Drizzle ORM client with schema
export const db = drizzle(expoDb, { schema });

// Helper to initialize raw tables if migrations are running in development/standalone
export function initializeTablesSync() {
  expoDb.execSync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      stream TEXT NOT NULL,
      grade_level INTEGER NOT NULL,
      icon TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS units (
      id TEXT PRIMARY KEY NOT NULL,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      unit_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS short_notes (
      id TEXT PRIMARY KEY NOT NULL,
      unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content_markdown TEXT NOT NULL,
      is_high_yield INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY NOT NULL,
      unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
      prompt TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_option_id TEXT NOT NULL,
      explanation TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      unit_id TEXT,
      score REAL NOT NULL,
      total_questions INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      is_synced INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
      id TEXT PRIMARY KEY NOT NULL,
      subject_id TEXT NOT NULL UNIQUE REFERENCES subjects(id) ON DELETE CASCADE,
      content_hash TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      last_updated TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_units_subject ON units(subject_id);
    CREATE INDEX IF NOT EXISTS idx_notes_unit ON short_notes(unit_id);
    CREATE INDEX IF NOT EXISTS idx_questions_unit ON questions(unit_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_user ON quiz_attempts(user_id);
  `);
}
