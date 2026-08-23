import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/infrastructure/database/prisma";
import { UserRole } from "@/domain/enums";

/**
 * Production Auth configuration (Auth.js / NextAuth v5)
 *
 * - Credentials provider (email/phone + password)
 * - JWT strategy (stateless, works well with multi-tenant)
 * - Role + tenantId injected into session
 * - Super Admin has tenantId = null
 */

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Look up user (email is unique per tenant, but Super Admin has global email)
        const user = await prisma.user.findFirst({
          where: {
            email: email.toLowerCase().trim(),
            deletedAt: null,
            isActive: true,
          },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        // Update last login (fire-and-forget)
        prisma.user
          .update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
          .catch(() => {});

        const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          isSuperAdmin,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 12, // 12 hours
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.isSuperAdmin = user.isSuperAdmin;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = (token.tenantId as string | null) ?? null;
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin);
      }
      return session;
    },
  },

  trustHost: true,
});
