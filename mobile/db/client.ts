import { Platform } from 'react-native';
import * as schema from './schema';

export const DATABASE_NAME = 'kurazprep.db';

// Native client holders
let expoDbInstance: any = null;
let dbInstance: any = null;

// Starter curriculum preloaded for Web demo & instant offline access
export const STARTER_DATA = {
  subjects: [
    {
      id: 'subj-phys-12',
      name: 'Physics',
      stream: 'NATURAL',
      gradeLevel: 12,
      icon: 'atom',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'subj-math-12',
      name: 'Mathematics',
      stream: 'NATURAL',
      gradeLevel: 12,
      icon: 'calculator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  units: [
    {
      id: 'unit-phys12-1',
      subjectId: 'subj-phys-12',
      unitNumber: 1,
      title: 'Thermodynamics & Heat Engines',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'unit-math12-1',
      subjectId: 'subj-math-12',
      unitNumber: 1,
      title: 'Sequences and Series',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  shortNotes: [
    {
      id: 'note-phys12-1-1',
      unitId: 'unit-phys12-1',
      title: 'First Law of Thermodynamics & Work Done',
      isHighYield: true,
      orderIndex: 1,
      contentMarkdown: `# First Law of Thermodynamics

The **First Law of Thermodynamics** states that energy cannot be created or destroyed:

$$\\Delta U = Q - W$$

Where:
* $\\Delta U$ = change in internal energy
* $Q$ = heat added to system ($Q > 0$ when absorbed)
* $W$ = work done by the system ($W = P\\Delta V$ at constant pressure)

### Thermodynamic Processes:
1. **Isochoric (Constant Volume):** $\\Delta V = 0 \\implies W = 0$, so $\\Delta U = Q$.
2. **Isobaric (Constant Pressure):** $W = P(V_2 - V_1)$.
3. **Isothermal (Constant Temp):** $\\Delta U = 0 \\implies Q = W = nRT \\ln(V_2 / V_1)$.
4. **Adiabatic (No Heat Transfer):** $Q = 0 \\implies \\Delta U = -W$.

> **ESSLCE Tip:** In an adiabatic expansion, gas cools down because it does work at the expense of its internal energy!`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'note-math12-1-1',
      unitId: 'unit-math12-1',
      title: 'Arithmetic & Geometric Progressions',
      isHighYield: true,
      orderIndex: 1,
      contentMarkdown: `# Sequences and Series

### Arithmetic Progression (AP)
* **General Term:** $a_n = a_1 + (n - 1)d$
* **Sum of first $n$ terms:**
$$S_n = \\frac{n}{2}[2a_1 + (n - 1)d] = \\frac{n}{2}(a_1 + a_n)$$

### Geometric Progression (GP)
* **General Term:** $a_n = a_1 \\cdot r^{n-1}$
* **Sum to infinity ($|r| < 1$):**
$$S_\\infty = \\frac{a_1}{1 - r}$$`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  questions: [
    {
      id: 'q-phys12-1-1',
      unitId: 'unit-phys12-1',
      prompt: 'An ideal gas expands from 2.0 m³ to 5.0 m³ at a constant pressure of 1.0 × 10⁵ Pa. What is the work done by the gas?',
      optionsJson: JSON.stringify([
        { id: 'opt-a', text: '1.5 × 10⁵ J' },
        { id: 'opt-b', text: '3.0 × 10⁵ J' },
        { id: 'opt-c', text: '5.0 × 10⁵ J' },
        { id: 'opt-d', text: '7.0 × 10⁵ J' },
      ]),
      correctOptionId: 'opt-b',
      explanation: 'Work done at constant pressure: W = P * ΔV = 1.0 × 10⁵ Pa * (5.0 - 2.0) m³ = 3.0 × 10⁵ J.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'q-math12-1-1',
      unitId: 'unit-math12-1',
      prompt: 'If the sum of an infinite geometric series with first term a₁ = 6 is 18, what is the common ratio r?',
      optionsJson: JSON.stringify([
        { id: 'opt-a', text: '1/3' },
        { id: 'opt-b', text: '2/3' },
        { id: 'opt-c', text: '1/2' },
        { id: 'opt-d', text: '3/4' },
      ]),
      correctOptionId: 'opt-b',
      explanation: 'S_∞ = a₁ / (1 - r) => 18 = 6 / (1 - r) => 1 - r = 1/3 => r = 2/3.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  quizAttempts: [] as any[],
  syncMetadata: [] as any[],
};

// Web memory/localStorage storage
class WebDatabaseAdapter {
  private data: typeof STARTER_DATA;

  constructor() {
    this.data = { ...STARTER_DATA };
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem('kurazprep_web_db');
        if (stored) {
          this.data = JSON.parse(stored);
        }
      } catch (e) {
        // Fallback to memory
      }
    }
  }

  private save() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('kurazprep_web_db', JSON.stringify(this.data));
      } catch (e) {}
    }
  }

  select(fields?: any) {
    const self = this;
    return {
      from: (tableObj: any) => {
        const tableName = tableObj._?.name || 'subjects';
        let records: any[] = [];
        if (tableName === 'subjects') records = [...self.data.subjects];
        else if (tableName === 'units') records = [...self.data.units];
        else if (tableName === 'short_notes') records = [...self.data.shortNotes];
        else if (tableName === 'questions') records = [...self.data.questions];
        else if (tableName === 'quiz_attempts') records = [...self.data.quizAttempts];
        else if (tableName === 'sync_metadata') records = [...self.data.syncMetadata];

        const queryObj: any = {
          where: (condition: any) => queryObj,
          orderBy: (order: any) => queryObj,
          limit: (n: number) => records.slice(0, n),
          innerJoin: (tbl: any, cond: any) => queryObj,
          leftJoin: (tbl: any, cond: any) => queryObj,
          then: (resolve: any) => resolve(records),
          catch: (reject: any) => queryObj,
        };

        // Make it thenable so await db.select().from(...) works seamlessly
        return queryObj;
      },
    };
  }

  insert(tableObj: any) {
    const self = this;
    const tableName = tableObj._?.name || '';
    return {
      values: (val: any) => {
        const row = Array.isArray(val) ? val[0] : val;
        if (tableName === 'quiz_attempts') {
          self.data.quizAttempts.unshift(row);
          self.save();
        } else if (tableName === 'subjects') {
          const idx = self.data.subjects.findIndex((s) => s.id === row.id);
          if (idx >= 0) self.data.subjects[idx] = row;
          else self.data.subjects.push(row);
          self.save();
        }
        const insertObj: any = {
          onConflictDoNothing: () => insertObj,
          onConflictDoUpdate: () => insertObj,
          then: (resolve: any) => resolve([row]),
        };
        return insertObj;
      },
    };
  }

  update(tableObj: any) {
    const self = this;
    const tableName = tableObj._?.name || '';
    return {
      set: (updates: any) => ({
        where: (cond: any) => {
          if (tableName === 'quiz_attempts') {
            self.data.quizAttempts.forEach((a) => Object.assign(a, updates));
            self.save();
          }
          return Promise.resolve();
        },
      }),
    };
  }

  async transaction(cb: any) {
    return cb(this);
  }
}

if (Platform.OS !== 'web') {
  try {
    const { openDatabaseSync } = require('expo-sqlite');
    const { drizzle } = require('drizzle-orm/expo-sqlite');
    expoDbInstance = openDatabaseSync(DATABASE_NAME);
    dbInstance = drizzle(expoDbInstance, { schema });
  } catch (err) {
    console.warn('Native SQLite init fallback:', err);
    dbInstance = new WebDatabaseAdapter();
  }
} else {
  // Web browser runtime
  dbInstance = new WebDatabaseAdapter();
  expoDbInstance = {
    execSync: () => {},
    runSync: () => ({ changes: 0, lastInsertRowId: 0 }),
    getFirstSync: () => null,
    getAllSync: () => [],
  };
}

export const expoDb = expoDbInstance;
export const db = dbInstance;

// Helper to initialize raw tables
export function initializeTablesSync() {
  if (Platform.OS === 'web' || !expoDb?.execSync) return;

  try {
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
  } catch (e) {
    console.warn('Table initialization warning:', e);
  }
}
