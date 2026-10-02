import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { clientIp, logAudit } from "@/lib/audit";

// Best-effort, per-instance brute-force throttle (use a shared store in multi-instance deploys).
const MAX_FAILURES = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; first: number }>();

function isLocked(key: string) {
  const entry = failures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > LOCK_WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(key: string) {
  const entry = failures.get(key);
  if (!entry || Date.now() - entry.first > LOCK_WINDOW_MS) {
    failures.set(key, { count: 1, first: Date.now() });
  } else {
    entry.count += 1;
  }
}

// Used to keep response time similar whether or not the account exists.
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8.4v1J0m6o5Hq1b8k3T1oVwQ8Qe9eK";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const ip = clientIp(new Headers((req?.headers ?? {}) as Record<string, string>));
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter an email and password");
        }

        const email = credentials.email.trim().toLowerCase();
        if (isLocked(email)) {
          throw new Error("Too many failed attempts. Please try again in 15 minutes.");
        }

        const user = await prisma.user.findUnique({ where: { email } });
        const isPasswordValid = await compare(
          credentials.password,
          user?.passwordHash ?? DUMMY_HASH
        );

        // Same message for unknown email, wrong password and inactive account
        if (!user || !user.isActive || !isPasswordValid) {
          recordFailure(email);
          await logAudit({ userId: user?.id, action: "LOGIN_FAILED", entity: "auth", metadata: { email }, ipAddress: ip });
          throw new Error("Invalid email or password");
        }

        failures.delete(email);
        await logAudit({ userId: user.id, action: "LOGIN", entity: "auth", metadata: { email }, ipAddress: ip });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
