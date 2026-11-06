import {
  pgTable,
  text,
  varchar,
  integer,
  smallint,
  boolean,
  timestamp,
  date,
  customType,
  jsonb,
  bigserial,
  bigint,
  primaryKey,
  check,
  unique,
  index
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Custom PostgreSQL bytea type for small profile avatars (<= 35 KB)
export const bytea = customType({
  dataType() {
    return "bytea";
  }
});

// 1. Users table (Core Identity)
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  passwordHash: text("password_hash"),
  salt: text("salt"),
  role: varchar("role", { length: 20 }).notNull().default("student"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true })
});

// 2. Sessions table (Secure Server-Side Tokens)
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

// 3. Profiles table (Scholar Level, XP, Coins, Streak — clean slate starts from 0)
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  activeTitle: varchar("active_title", { length: 100 }).notNull().default(""),
  xp: integer("xp").notNull().default(0),
  coins: integer("coins").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  lastActiveDate: date("last_active_date"), // Stored in WIB date (Asia/Jakarta)
  avatarKey: varchar("avatar_key", { length: 50 }).notNull().default("avatar_1"),
  avatarUpdatedAt: timestamp("avatar_updated_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  check("check_profiles_xp_non_negative", sql`${table.xp} >= 0`),
  check("check_profiles_coins_non_negative", sql`${table.coins} >= 0`),
  check("check_profiles_streak_non_negative", sql`${table.streak} >= 0`)
]);

// 4. Avatars table (Compact WebP binary <= 35 KB)
export const avatars = pgTable("avatars", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  mimeType: varchar("mime_type", { length: 30 }).notNull().default("image/webp"),
  imageData: bytea("image_data").notNull(),
  fileSize: integer("file_size").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  check("check_avatar_size_limit", sql`${table.fileSize} <= 35840`)
]);

// 5. User Stats table (Accumulated Learning Statistics for Achievements)
export const userStats = pgTable("user_stats", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  wordsStarted: integer("words_started").notNull().default(0),
  wordsMastered: integer("words_mastered").notNull().default(0),
  b2Mastered: integer("b2_mastered").notNull().default(0),
  totalReviews: integer("total_reviews").notNull().default(0),
  grammarCompleted: integer("grammar_completed").notNull().default(0),
  readingCompleted: integer("reading_completed").notNull().default(0),
  storiesCompleted: integer("stories_completed").notNull().default(0),
  matchingCompleted: integer("matching_completed").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  check("check_stats_words_started", sql`${table.wordsStarted} >= 0`),
  check("check_stats_words_mastered", sql`${table.wordsMastered} >= 0`),
  check("check_stats_b2_mastered", sql`${table.b2Mastered} >= 0`),
  check("check_stats_total_reviews", sql`${table.totalReviews} >= 0`),
  check("check_stats_grammar_completed", sql`${table.grammarCompleted} >= 0`),
  check("check_stats_reading_completed", sql`${table.readingCompleted} >= 0`),
  check("check_stats_stories_completed", sql`${table.storiesCompleted} >= 0`),
  check("check_stats_matching_completed", sql`${table.matchingCompleted} >= 0`)
]);

// 6. Progress table (Spaced Repetition per Word)
export const progress = pgTable("progress", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  wordId: varchar("word_id", { length: 100 }).notNull(),
  level: varchar("level", { length: 10 }).notNull(),
  masteryStage: varchar("mastery_stage", { length: 20 }).notNull().default("fresh"),
  intervalDays: integer("interval_days").notNull().default(1),
  correctCount: integer("correct_count").notNull().default(0),
  wrongCount: integer("wrong_count").notNull().default(0),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true })
}, (table) => [
  primaryKey({ columns: [table.userId, table.wordId] }),
  check("check_progress_interval", sql`${table.intervalDays} >= 1`),
  check("check_progress_correct", sql`${table.correctCount} >= 0`),
  check("check_progress_wrong", sql`${table.wrongCount} >= 0`)
]);

// 7. Progress Events table (Idempotency Ledger for Learning Activities)
export const progressEvents = pgTable("progress_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: varchar("event_id", { length: 140 }).notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(),
  payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("uq_progress_events_user_event").on(table.userId, table.eventId),
  check("check_event_id_not_empty", sql`length(${table.eventId}) > 0`)
]);

// 8. Transactions table (XP and Coins Ledger)
export const transactions = pgTable("transactions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: varchar("event_id", { length: 140 }).notNull(),
  source: varchar("source", { length: 50 }).notNull(),
  xpAmount: integer("xp_amount").notNull().default(0),
  coinsAmount: integer("coins_amount").notNull().default(0),
  balanceAfterCoins: integer("balance_after_coins").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("uq_transactions_user_event").on(table.userId, table.eventId),
  check("check_trans_balance_non_negative", sql`${table.balanceAfterCoins} >= 0`)
]);

// 9. Grammar Progress table
export const grammarProgress = pgTable("grammar_progress", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  topicId: varchar("topic_id", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("not_started"),
  score: integer("score").notNull().default(0),
  total: integer("total").notNull().default(0),
  completedAt: timestamp("completed_at", { withTimezone: true })
}, (table) => [
  primaryKey({ columns: [table.userId, table.topicId] })
]);

// 10. Story Progress table (Sequential Story Progression)
export const storyProgress = pgTable("story_progress", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id", { length: 50 }).notNull(),
  currentEpisode: integer("current_episode").notNull().default(1),
  completedEpisodes: jsonb("completed_episodes").notNull().default(sql`'[]'::jsonb`),
  isStoryCompleted: boolean("is_story_completed").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  primaryKey({ columns: [table.userId, table.storyId] }),
  check("check_story_episode", sql`${table.currentEpisode} >= 1`)
]);

// 11. Daily Quests table (Missions in Asia/Jakarta WIB Timezone)
export const dailyQuests = pgTable("daily_quests", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questDate: date("quest_date").notNull(),
  questId: varchar("quest_id", { length: 80 }).notNull(),
  currentProgress: integer("current_progress").notNull().default(0),
  target: integer("target").notNull(),
  isCompleted: boolean("is_completed").notNull().default(false)
}, (table) => [
  unique("uq_daily_quests_user_date_quest").on(table.userId, table.questDate, table.questId),
  check("check_quest_target_positive", sql`${table.target} > 0`),
  check("check_quest_progress_non_negative", sql`${table.currentProgress} >= 0`)
]);

// 12. Quest Claims table (Single-claim Validation per Day)
export const questClaims = pgTable("quest_claims", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  questDate: date("quest_date").notNull(),
  questId: varchar("quest_id", { length: 80 }).notNull(),
  xpReward: integer("xp_reward").notNull(),
  coinsReward: integer("coins_reward").notNull(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("uq_quest_claims_user_date_quest").on(table.userId, table.questDate, table.questId),
  check("check_claim_xp_non_negative", sql`${table.xpReward} >= 0`),
  check("check_claim_coins_non_negative", sql`${table.coinsReward} >= 0`)
]);

// 13. Activity Log table (Session Summary History — Permanent)
export const activityLog = pgTable("activity_log", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  activityType: varchar("activity_type", { length: 30 }).notNull(), // 'vocabulary', 'srs_review', 'grammar', 'reading_quiz', 'matching', 'story'
  title: varchar("title", { length: 150 }).notNull(),
  score: integer("score"),
  totalQuestions: integer("total_questions"),
  accuracyPercent: smallint("accuracy_percent"),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
  coinsEarned: integer("coins_earned").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

// 14. Attempt Details table (Question/Answer Detail — 90 Days Retention)
export const attemptDetails = pgTable("attempt_details", {
  activityId: text("activity_id").primaryKey().references(() => activityLog.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  wrongItems: jsonb("wrong_items").notNull().default(sql`'[]'::jsonb`),
  questionsBreakdown: jsonb("questions_breakdown").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

// 15. Catalog table (Collection Store Catalog)
export const catalog = pgTable("catalog", {
  id: varchar("id", { length: 60 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'border', 'outfit', 'utility'
  category: varchar("category", { length: 30 }).notNull(),
  price: integer("price").notNull(),
  levelReq: integer("level_req").notNull().default(1),
  rarity: varchar("rarity", { length: 20 }).notNull().default("common"),
  assetUrl: text("asset_url"),
  isActive: boolean("is_active").notNull().default(true)
}, (table) => [
  check("check_catalog_price_non_negative", sql`${table.price} >= 0`),
  check("check_catalog_level_positive", sql`${table.levelReq} >= 1`)
]);

// 16. Inventory table
export const inventory = pgTable("inventory", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemId: varchar("item_id", { length: 60 }).notNull().references(() => catalog.id),
  equipped: boolean("equipped").notNull().default(false),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("uq_inventory_user_item").on(table.userId, table.itemId)
]);

// 17. Titles table (Scholar Milestone Titles)
export const titles = pgTable("titles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  titleId: varchar("title_id", { length: 80 }).notNull(),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("uq_titles_user_title").on(table.userId, table.titleId)
]);

// 18. Settings table (User Preferences)
export const settings = pgTable("settings", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  dailyGoal: integer("daily_goal").notNull().default(10),
  theme: varchar("theme", { length: 20 }).notNull().default("light"),
  soundEffects: boolean("sound_effects").notNull().default(true),
  morningReminderHour: smallint("morning_reminder_hour").default(7),
  eveningReminderHour: smallint("evening_reminder_hour").default(19),
  reminderEnabled: boolean("reminder_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  check("check_settings_daily_goal_positive", sql`${table.dailyGoal} > 0`)
]);


// 19. Persistent login rate-limit windows (shared across serverless instances)
export const authRateLimits = pgTable("auth_rate_limits", {
  keyHash: varchar("key_hash", { length: 64 }).primaryKey(),
  windowStartedAt: timestamp("window_started_at", { withTimezone: true }).notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  check("check_auth_rate_attempt_count", sql`${table.attemptCount} >= 0`),
  index("idx_auth_rate_limits_updated_at").on(table.updatedAt)
]);


// Better Auth core tables. The legacy "sessions" table above remains as a
// temporary compatibility bridge for older SinauEnglish API endpoints.
export const authSessions = pgTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("idx_auth_sessions_user_id").on(table.userId)
]);

export const authAccounts = pgTable("auth_accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  unique("uq_auth_accounts_provider_account").on(table.providerId, table.accountId),
  index("idx_auth_accounts_user_id").on(table.userId)
]);

export const authVerifications = pgTable("auth_verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index("idx_auth_verifications_identifier").on(table.identifier)
]);

export const authRateLimitRecords = pgTable("auth_rate_limits", {
  id: text("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  count: integer("count").notNull().default(0),
  lastRequest: bigint("last_request", { mode: "number" }).notNull()
});
