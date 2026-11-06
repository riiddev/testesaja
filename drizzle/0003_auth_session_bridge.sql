-- Tie compatibility bearer sessions to Better Auth sessions.
-- Existing legacy sessions keep auth_session_id = NULL and are unaffected.
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "auth_session_id" text;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_sessions_auth_session'
  ) THEN
    ALTER TABLE "sessions"
      ADD CONSTRAINT "fk_sessions_auth_session"
      FOREIGN KEY ("auth_session_id")
      REFERENCES "auth_sessions"("id")
      ON DELETE CASCADE;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sessions_auth_session_id"
  ON "sessions" USING btree ("auth_session_id");
