import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { FamilyRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      familyId?: string | null;
      role?: FamilyRole;
    };
  }
  interface JWT {
    id: string;
    familyId?: string | null;
    role?: FamilyRole;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.id = user.id as string;
      }
      const shouldRefresh = !!user || trigger === "update" || !token.familyId;
      if (token.id && shouldRefresh) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { familyId: true, role: true },
        });
        token.familyId = dbUser?.familyId ?? null;
        token.role = (dbUser?.role ?? "CHILD") as FamilyRole;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.familyId = token.familyId as string | null;
      session.user.role = token.role as FamilyRole;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
