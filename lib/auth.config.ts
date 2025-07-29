import { LoginSchema } from "@/schemas/auth.schemas";
import { compare } from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "./prisma";

class InvalidLoginError extends CredentialsSignin {
  code = "Invalid identifier or password";
}

export default {
  providers: [
    Credentials({
      name: "credentials",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "Email" },
        phone: { label: "Phone", type: "text", placeholder: "Phone" },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Password",
        },
        type: {
          label: "Type",
          type: "select",
          options: [
            { value: "email", label: "Email" },
            { value: "phone", label: "Phone" },
          ],
        },
      },
      authorize: async (credentials) => {
        const { success, data } = LoginSchema.safeParse(credentials);

        if (!success) {
          throw new InvalidLoginError("Geçersiz giriş bilgileri");
        }

        const user = await prisma.user.findUnique({
          where: {
            ...(data.type === "email"
              ? {
                  email: data.email,
                }
              : {
                  phone: data.phone,
                }),
          },
        });

        if (!user || !user.password) {
          throw new InvalidLoginError("Kullanıcı bulunamadı");
        }

        const isValidPassword = await compare(data.password, user.password);

        if (!isValidPassword) {
          throw new InvalidLoginError(
            "Kullanıcı adı veya şifre yanlış. Lütfen tekrar deneyiniz."
          );
        }

        const { password, ...noPasswordUser } = user;

        return {
          role: user.role,
          verified: user.email ? true : false,
          ...(user.email ? { email: user.email } : {}),
          ...(user.phone ? { phone: user.phone } : {}),
          id: user.id,
          name: `${user.name?.charAt(0).toUpperCase() + user.name?.slice(1)} ${
            user.surname?.charAt(0).toUpperCase() + user.surname?.slice(1)
          }`,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;
