// NextAuth v5 + Google OAuth + Prisma adapter.
// Env vars (v5-native names): AUTH_SECRET, AUTH_GOOGLE_ID,
// AUTH_GOOGLE_SECRET, NEXTAUTH_URL. The Google provider auto-reads its
// ID/secret from AUTH_GOOGLE_* — no need to pass them explicitly.

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: { strategy: "jwt" },
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarHue: Math.floor(Math.random() * 360) },
      });
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      // First sign-in: persist user id + avatarHue onto the JWT. The
      // createUser event may not have run yet, so re-read from DB.
      if (user?.id) {
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { avatarHue: true },
        });
        token.avatarHue = dbUser?.avatarHue ?? 200;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
        session.user.avatarHue =
          typeof token.avatarHue === "number" ? token.avatarHue : 200;
      }
      return session;
    },
  },
});
