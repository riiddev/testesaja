CREATE TABLE IF NOT EXISTS "auth_rate_limits" (
  "key_hash" varchar(64) PRIMARY KEY NOT NULL,
  "window_started_at" timestamp with time zone NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "check_auth_rate_attempt_count" CHECK ("auth_rate_limits"."attempt_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_auth_rate_limits_updated_at"
  ON "auth_rate_limits" USING btree ("updated_at");
