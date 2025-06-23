import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { Pool } from "pg"

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: {
      rejectUnauthorized: false
    }
  }),
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:9002",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [nextCookies()],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // 1 día
  },
})

export type Session = typeof auth.$Infer.Session