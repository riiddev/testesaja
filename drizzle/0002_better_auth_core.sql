-- Better Auth core schema (additive; does not delete or reset existing data).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" text;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "expires_at" timestamp with time zone NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_auth_sessions_user_id" ON "auth_sessions" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp with time zone,
  "refresh_token_expires_at" timestamp with time zone,
  "scope" text,
  "password" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "uq_auth_accounts_provider_account" UNIQUE ("provider_id", "account_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_auth_accounts_user_id" ON "auth_accounts" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_verifications" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_auth_verifications_identifier" ON "auth_verifications" USING btree ("identifier");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "better_auth_rate_limits" (
  "id" text PRIMARY KEY NOT NULL,
  "key" varchar(255) NOT NULL UNIQUE,
  "count" integer DEFAULT 0 NOT NULL,
  "last_request" bigint NOT NULL
);
