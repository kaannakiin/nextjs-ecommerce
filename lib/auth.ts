import NextAuth from "next-auth";
import authConfig from "./auth.config";

import { Role } from "@/app/generated/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: "token",
    },
    callbackUrl: {
      name: "callbackUrl",
    },
    csrfToken: {
      name: "csrfToken",
    },
  },
  pages: {
    newUser: "/register",
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = user.role;
        token.verified = user.verified;

        if (user.email) {
          token.email = user.email;
        }
        if (user.phone) {
          token.phone = user.phone;
        }

        delete token.picture;
        delete token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        name: token.name as string,
        role: token.role as Role,
        verified: token.verified as boolean,
        ...(token.email ? { email: token.email as string } : {}),
        ...(token.phone ? { phone: token.phone as string } : {}),
      } as any;

      return session;
    },
  },
  trustHost: true,
  ...authConfig,
});
