"use server";
import { signIn } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  LoginSchema,
  LoginSchemaType,
  RegisterSchema,
  RegisterSchemaType,
} from "@/schemas/auth.schemas";
import { ActionResponse } from "@/types/globalTypes";
import { hash } from "bcryptjs";
import { CredentialsSignin } from "next-auth";
import { treeifyError } from "zod";

export const RegisterAction = async (
  formData: RegisterSchemaType
): Promise<ActionResponse> => {
  try {
    const { success, data, error } = RegisterSchema.safeParse(formData);
    if (!success) {
      return {
        success: false,
        message: treeifyError(error)
          .errors.map((err) => err)
          .join(", "),
      };
    }
    const isUserExists = await prisma.user.findFirst({
      where: data.email ? { email: data.email } : { phone: data.phone },
    });

    if (isUserExists) {
      return {
        success: false,
        message: "Bu kullanıcı zaten kayıtlı. Lütfen giriş yaparak devam edin.",
      };
    }

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        surname: data.surname,
        phone: data.phone,
        email: data.email,
        password: await hash(data.password, 10),
        role: "USER",
      },
    });

    return {
      success: true,
      message: "Başarıyla kayıt olundu.",
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      message: "An error occurred while registering the user.",
    };
  }
};

export const LoginAction = async (
  formData: LoginSchemaType
): Promise<ActionResponse> => {
  try {
    const { success, data, error } = LoginSchema.safeParse(formData);
    if (!success) {
      return {
        success: false,
        message: treeifyError(error)
          .errors.map((err) => err)
          .join(", "),
      };
    }

    const result = await signIn("credentials", {
      type: data.type,
      ...(data.type === "email"
        ? { email: data.email }
        : { phone: data.phone }),
      password: data.password,
      redirect: false,
    });
    return {
      success: true,
      message: "Başarıyla giriş yapıldı.",
    };
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof CredentialsSignin) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            message: "Email/telefon veya şifre hatalı.",
          };
        default:
          return {
            success: false,
            message: "Giriş yapılırken bir hata oluştu.",
          };
      }
    }

    // Diğer hatalar için
    return {
      success: false,
      message: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.",
    };
  }
};
