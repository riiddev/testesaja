import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, schema } from "../../db/index.js";

const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:5173";

export const auth = betterAuth({
  appName: "SinauEnglish",
  baseURL,
  trustedOrigins: [baseURL],
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    transaction: false,
    schema: {
      user: schema.users,
      session: schema.authSessions,
      account: schema.authAccounts,
      verification: schema.authVerifications,
      rateLimit: schema.authRateLimitRecords
    }
  }),
  user: {
    fields: {
      name: "displayName"
    },
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: false
      }
    }
  },
  session: {
    expiresIn: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
    cookieCache: {
      enabled: false
    }
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true
    // Email delivery is intentionally not enabled until a mail sender is configured.
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 15 * 60, max: 5 },
      "/sign-up/email": { window: 60 * 60, max: 5 },
      "/forget-password": { window: 15 * 60, max: 3 }
    }
  },
  advanced: {
    useSecureCookies: process.env.VERCEL === "1" || process.env.NODE_ENV === "production"
  }
});
