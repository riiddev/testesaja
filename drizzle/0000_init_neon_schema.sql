CREATE TABLE "activity_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"activity_type" varchar(30) NOT NULL,
	"title" varchar(150) NOT NULL,
	"score" integer,
	"total_questions" integer,
	"accuracy_percent" smallint,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"coins_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attempt_details" (
	"activity_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"wrong_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"questions_breakdown" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "avatars" (
	"user_id" text PRIMARY KEY NOT NULL,
	"mime_type" varchar(30) DEFAULT 'image/webp' NOT NULL,
	"image_data" "bytea" NOT NULL,
	"file_size" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_avatar_size_limit" CHECK ("avatars"."file_size" <= 35840)
);
--> statement-breakpoint
CREATE TABLE "catalog" (
	"id" varchar(60) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(20) NOT NULL,
	"category" varchar(30) NOT NULL,
	"price" integer NOT NULL,
	"level_req" integer DEFAULT 1 NOT NULL,
	"rarity" varchar(20) DEFAULT 'common' NOT NULL,
	"asset_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "check_catalog_price_non_negative" CHECK ("catalog"."price" >= 0),
	CONSTRAINT "check_catalog_level_positive" CHECK ("catalog"."level_req" >= 1)
);
--> statement-breakpoint
CREATE TABLE "daily_quests" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quest_date" date NOT NULL,
	"quest_id" varchar(80) NOT NULL,
	"current_progress" integer DEFAULT 0 NOT NULL,
	"target" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "uq_daily_quests_user_date_quest" UNIQUE("user_id","quest_date","quest_id"),
	CONSTRAINT "check_quest_target_positive" CHECK ("daily_quests"."target" > 0),
	CONSTRAINT "check_quest_progress_non_negative" CHECK ("daily_quests"."current_progress" >= 0)
);
--> statement-breakpoint
CREATE TABLE "grammar_progress" (
	"user_id" text NOT NULL,
	"topic_id" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'not_started' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "grammar_progress_user_id_topic_id_pk" PRIMARY KEY("user_id","topic_id")
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"item_id" varchar(60) NOT NULL,
	"equipped" boolean DEFAULT false NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_user_item" UNIQUE("user_id","item_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"active_title" varchar(100) DEFAULT '' NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"coins" integer DEFAULT 0 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"last_active_date" date,
	"avatar_key" varchar(50) DEFAULT 'avatar_1' NOT NULL,
	"avatar_updated_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_profiles_xp_non_negative" CHECK ("profiles"."xp" >= 0),
	CONSTRAINT "check_profiles_coins_non_negative" CHECK ("profiles"."coins" >= 0),
	CONSTRAINT "check_profiles_streak_non_negative" CHECK ("profiles"."streak" >= 0)
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"user_id" text NOT NULL,
	"word_id" varchar(100) NOT NULL,
	"level" varchar(10) NOT NULL,
	"mastery_stage" varchar(20) DEFAULT 'fresh' NOT NULL,
	"interval_days" integer DEFAULT 1 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"wrong_count" integer DEFAULT 0 NOT NULL,
	"next_review_at" timestamp with time zone,
	"last_reviewed_at" timestamp with time zone,
	CONSTRAINT "progress_user_id_word_id_pk" PRIMARY KEY("user_id","word_id"),
	CONSTRAINT "check_progress_interval" CHECK ("progress"."interval_days" >= 1),
	CONSTRAINT "check_progress_correct" CHECK ("progress"."correct_count" >= 0),
	CONSTRAINT "check_progress_wrong" CHECK ("progress"."wrong_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "progress_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event_id" varchar(140) NOT NULL,
	"activity_type" varchar(50) NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_progress_events_user_event" UNIQUE("user_id","event_id"),
	CONSTRAINT "check_event_id_not_empty" CHECK (length("progress_events"."event_id") > 0)
);
--> statement-breakpoint
CREATE TABLE "quest_claims" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"quest_date" date NOT NULL,
	"quest_id" varchar(80) NOT NULL,
	"xp_reward" integer NOT NULL,
	"coins_reward" integer NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_quest_claims_user_date_quest" UNIQUE("user_id","quest_date","quest_id"),
	CONSTRAINT "check_claim_xp_non_negative" CHECK ("quest_claims"."xp_reward" >= 0),
	CONSTRAINT "check_claim_coins_non_negative" CHECK ("quest_claims"."coins_reward" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"daily_goal" integer DEFAULT 10 NOT NULL,
	"theme" varchar(20) DEFAULT 'light' NOT NULL,
	"sound_effects" boolean DEFAULT true NOT NULL,
	"morning_reminder_hour" smallint DEFAULT 7,
	"evening_reminder_hour" smallint DEFAULT 19,
	"reminder_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_settings_daily_goal_positive" CHECK ("settings"."daily_goal" > 0)
);
--> statement-breakpoint
CREATE TABLE "story_progress" (
	"user_id" text NOT NULL,
	"story_id" varchar(50) NOT NULL,
	"current_episode" integer DEFAULT 1 NOT NULL,
	"completed_episodes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_story_completed" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "story_progress_user_id_story_id_pk" PRIMARY KEY("user_id","story_id"),
	CONSTRAINT "check_story_episode" CHECK ("story_progress"."current_episode" >= 1)
);
--> statement-breakpoint
CREATE TABLE "titles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title_id" varchar(80) NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_titles_user_title" UNIQUE("user_id","title_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event_id" varchar(140) NOT NULL,
	"source" varchar(50) NOT NULL,
	"xp_amount" integer DEFAULT 0 NOT NULL,
	"coins_amount" integer DEFAULT 0 NOT NULL,
	"balance_after_coins" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_transactions_user_event" UNIQUE("user_id","event_id"),
	CONSTRAINT "check_trans_balance_non_negative" CHECK ("transactions"."balance_after_coins" >= 0)
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"user_id" text PRIMARY KEY NOT NULL,
	"words_started" integer DEFAULT 0 NOT NULL,
	"words_mastered" integer DEFAULT 0 NOT NULL,
	"b2_mastered" integer DEFAULT 0 NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"grammar_completed" integer DEFAULT 0 NOT NULL,
	"reading_completed" integer DEFAULT 0 NOT NULL,
	"stories_completed" integer DEFAULT 0 NOT NULL,
	"matching_completed" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "check_stats_words_started" CHECK ("user_stats"."words_started" >= 0),
	CONSTRAINT "check_stats_words_mastered" CHECK ("user_stats"."words_mastered" >= 0),
	CONSTRAINT "check_stats_b2_mastered" CHECK ("user_stats"."b2_mastered" >= 0),
	CONSTRAINT "check_stats_total_reviews" CHECK ("user_stats"."total_reviews" >= 0),
	CONSTRAINT "check_stats_grammar_completed" CHECK ("user_stats"."grammar_completed" >= 0),
	CONSTRAINT "check_stats_reading_completed" CHECK ("user_stats"."reading_completed" >= 0),
	CONSTRAINT "check_stats_stories_completed" CHECK ("user_stats"."stories_completed" >= 0),
	CONSTRAINT "check_stats_matching_completed" CHECK ("user_stats"."matching_completed" >= 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"password_hash" text NOT NULL,
	"salt" text,
	"role" varchar(20) DEFAULT 'student' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_details" ADD CONSTRAINT "attempt_details_activity_id_activity_log_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activity_log"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_details" ADD CONSTRAINT "attempt_details_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "avatars" ADD CONSTRAINT "avatars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_quests" ADD CONSTRAINT "daily_quests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_progress" ADD CONSTRAINT "grammar_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_item_id_catalog_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."catalog"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_events" ADD CONSTRAINT "progress_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest_claims" ADD CONSTRAINT "quest_claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_progress" ADD CONSTRAINT "story_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "titles" ADD CONSTRAINT "titles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;