# KurazPrep MVP (Ethiopian ESSLCE Offline-First Preparation Platform)

KurazPrep is an offline-first mobile application and lightweight backend engineered for Ethiopian high school students preparing for the ESSLCE (Grade 11–12, Natural & Social streams). The platform enables students to download curriculum-aligned short notes, solve practice MCQs, and track progress offline, syncing delta updates and attempt history whenever internet connectivity is available.

---

## 1. Technical Stack

### Monorepo Structure
```
KurazPrepMVP/
├── backend/                  # Fastify v5 + Prisma v6 + Vercel Zero-Config
│   ├── prisma/
│   │   ├── schema.prisma     # PgBouncer (6543) & Direct URL (5432)
│   │   └── seed.ts           # ESSLCE sample curriculum seeder
│   └── src/
│       ├── app.ts            # Fastify v5 factory
│       ├── index.ts          # Local server & Vercel serverless export
│       ├── db/prisma.ts      # Global cached Prisma client
│       ├── routes/           # Auth, Subjects, Delta Sync, Attempts
│       └── services/         # Deterministic SHA-256 content hashing
└── mobile/                   # React Native (Expo SDK 51) + Drizzle ORM
    ├── app/                  # expo-router file-based routing
    │   ├── (tabs)/           # Study, Practice, Progress, Settings
    │   ├── subjects/[id].tsx # Unit tree explorer
    │   ├── notes/[unitId].tsx# Markdown & LaTeX Math reader
    │   └── quiz/[unitId].tsx # MCQ engine with instant feedback & SQLite persistence
    ├── db/
    │   ├── schema.ts         # Drizzle SQLite schema mirroring Prisma
    │   └── client.ts         # Expo SQLite connection
    ├── drizzle/              # Generated Drizzle SQL migrations
    ├── services/             # Delta sync manager & API client
    ├── stores/               # Zustand authStore & syncStore
    ├── babel.config.js       # inline-import plugin for .sql
    ├── metro.config.js       # sql extension in sourceExts
    └── drizzle.config.ts     # dialect: sqlite, driver: expo
```

---

## 2. Core Models

* **Subjects:** `id`, `name`, `stream` (NATURAL / SOCIAL), `gradeLevel` (11 / 12), `icon`.
* **Units:** `id`, `subjectId`, `unitNumber`, `title`.
* **ShortNotes:** `id`, `unitId`, `title`, `contentMarkdown` (with LaTeX math), `isHighYield`, `orderIndex`.
* **Questions:** `id`, `unitId`, `prompt`, `optionsJson`, `correctOptionId`, `explanation`.
* **QuizAttempts:** `id`, `userId`, `subjectId`, `unitId`, `score`, `totalQuestions`, `correctCount`, `isSynced`, `completedAt`.
* **SyncMetadata:** `id`, `subjectId`, `contentHash`, `version`, `lastUpdated`.

---

## 3. Getting Started

### Backend
```bash
cd backend
npm install
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

### Type Checking Both Workspaces
```bash
npm run typecheck
```
