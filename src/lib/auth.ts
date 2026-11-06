
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { user, session, account, verification } from "@/db/schema";

const productionUrl =
  "https://rice-leaf-disease-detection-ashen.vercel.app";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,

  baseURL: process.env.BETTER_AUTH_URL || productionUrl,

  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    productionUrl,
    ...(process.env.BETTER_AUTH_URL
      ? [process.env.BETTER_AUTH_URL]
      : []),
  ],

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
});
