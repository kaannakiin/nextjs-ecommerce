import NextAuth from "next-auth";
import authConfig from "./auth.config";

import { Role } from "@/app/generated/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { AdapterUser } from "next-auth/adapters";
import prisma from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: {
    ...PrismaAdapter(prisma),
    async createUser(user): Promise<AdapterUser> {
      const createdUser = await prisma.user.create({
        data: {
          id: user.id,
          name: user.name || null,
          email: user.email || null,
          image: user.image || null,
          verified: user.emailVerified ? true : false,
          role: Role.USER, // Default role
        },
      });

      // ✅ AdapterUser tipine uygun format döndür
      return {
        id: createdUser.id,
        role: createdUser.role,
        verified: createdUser.verified,
        phone: createdUser.phone || null,
        name: createdUser.name ? createdUser.name : "",
        email: createdUser.email!, // AdapterUser email required
        image: createdUser.image,
        emailVerified: createdUser.verified ? new Date() : null,
      };
    },

    async updateUser(user): Promise<AdapterUser> {
      const updatedUser = await prisma.user.update({
        where: { id: user.id! },
        data: {
          name: user.name,
          email: user.email,
          image: user.image,
          // ✅ emailVerified güncellenmesi durumunda verified'ı güncelle
          ...(user.emailVerified !== undefined && {
            verified: user.emailVerified ? true : false,
          }),
        },
      });

      return {
        id: updatedUser.id,
        name: updatedUser.name ? updatedUser.name : "",
        role: updatedUser.role,
        verified: updatedUser.verified,
        phone: updatedUser.phone || null,
        email: updatedUser.email!, // Required for AdapterUser
        image: updatedUser.image,
        emailVerified: updatedUser.verified ? new Date() : null,
      };
    },

    async getUser(id): Promise<AdapterUser | null> {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user || !user.email) return null; // AdapterUser email required

      return {
        id: user.id,
        name: user.name ? user.name : "",
        role: user.role,
        verified: user.verified,
        phone: user.phone || null,
        email: user.email,
        image: user.image,
        emailVerified: user.verified ? new Date() : null,
      };
    },

    async getUserByEmail(email): Promise<AdapterUser | null> {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) return null;

      return {
        id: user.id,
        name: user.name ? user.name : "",
        role: user.role,
        verified: user.verified,
        phone: user.phone || null,

        email: user.email!,
        image: user.image,
        emailVerified: user.verified ? new Date() : null,
      };
    },

    async getUserByAccount({
      providerAccountId,
      provider,
    }): Promise<AdapterUser | null> {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        select: { user: true },
      });

      if (!account?.user || !account.user.email) return null;

      return {
        id: account.user.id,
        name: account.user.name ? account.user.name : "",
        role: account.user.role,
        verified: account.user.verified,
        phone: account.user.phone || null,
        email: account.user.email,
        image: account.user.image,
        emailVerified: account.user.verified ? new Date() : null,
      };
    },
  },
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        return !!profile?.email_verified;
      }
      return true; // Do different verification for other providers that don't have `email_verified`
    },
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
