import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: {
              business: {
                select: {
                  id: true,
                  slug: true,
                  type: true,
                  subscriptionStatus: true,
                },
              },
            },
          });

          if (!user || !user.password) {
            throw new Error("No user found with this email");
          }

          if (!user.isActive) {
            throw new Error("Account is deactivated");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            businessId: user.business?.id ?? null,
            businessSlug: user.business?.slug ?? null,
            businessType: user.business?.type ?? null,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: UserRole }).role;
        token.businessId = (user as { businessId?: string }).businessId;
        token.businessSlug = (user as { businessSlug?: string }).businessSlug;
        token.businessType = (user as { businessType?: string }).businessType;
      }

      // Allow session update (for impersonation)
      if (trigger === "update" && session) {
        token.impersonating = session.impersonating;
        token.impersonatedBusinessId = session.impersonatedBusinessId;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.businessId = token.businessId as string | null;
        session.user.businessSlug = token.businessSlug as string | null;
        session.user.businessType = token.businessType as string | null;
        session.user.impersonating = token.impersonating as boolean | undefined;
        session.user.impersonatedBusinessId =
          token.impersonatedBusinessId as string | null;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For Google OAuth, ensure user exists in DB
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (existingUser && !existingUser.isActive) {
            return false;
          }
        } catch {
          return false;
        }
      }
      return true;
    },
  },
});

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: UserRole;
      businessId?: string | null;
      businessSlug?: string | null;
      businessType?: string | null;
      impersonating?: boolean;
      impersonatedBusinessId?: string | null;
    };
  }

  interface User {
    role?: UserRole;
    businessId?: string | null;
    businessSlug?: string | null;
    businessType?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: UserRole;
    businessId?: string | null;
    businessSlug?: string | null;
    businessType?: string | null;
    impersonating?: boolean;
    impersonatedBusinessId?: string | null;
  }
}
