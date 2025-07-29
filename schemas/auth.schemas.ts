import { $Enums } from "@/app/generated/prisma";
import {
  CountryCallingCode,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
} from "libphonenumber-js";
import * as z from "zod";

const getCountryCodes = (): string[] => {
  const countryCodes = getCountries();
  const callingCodes = countryCodes.map(
    (code) => `+${getCountryCallingCode(code)}`
  ) as CountryCallingCode[];
  return callingCodes;
};

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, { abort: true, message: "İsim en az 2 karakter olmalıdır" })
      .max(50, { message: "İsim en fazla 50 karakter olabilir" }),
    surname: z
      .string()
      .min(2, {
        abort: true,
        message: "Soyisim en az 2 karakter olmalıdır",
      })
      .max(50, {
        message: "Soyisim en fazla 50 karakter olabilir",
      }),
    email: z
      .email({
        message: "Geçerli bir email adresi giriniz",
      })
      .optional()
      .nullable(),
    phone: z.string().optional().nullable(),
    password: z
      .string()
      .min(6, {
        abort: true,
        message: "Şifre en az 6 karakter olmalıdır",
      })
      .max(50, {
        message: "Şifre en fazla 50 karakter olabilir",
      }),
    confirmPassword: z
      .string()
      .min(6, {
        abort: true,
        message: "Şifre tekrarı en az 6 karakter olmalıdır",
      })
      .max(50, {
        message: "Şifre tekrarı en fazla 50 karakter olabilir",
      }),
  })
  .check(({ value, issues }) => {
    if (value.password !== value.confirmPassword) {
      issues.push({
        code: "custom",
        input: value.confirmPassword,
        message: "Şifreler eşleşmiyor",
        path: ["confirmPassword"],
      });
    }

    // Email ve telefon kontrolü
    const isEmailProvided = value.email && value.email.trim() !== "";

    // Telefon kontrolü - calling code'ları boş sayarak
    const callingCodes = getCountryCodes();
    const phoneValue = value.phone?.trim() || "";

    // Telefon sadece calling code mu yoksa gerçek numara mı?
    const isPhoneJustCallingCode = callingCodes.includes(
      phoneValue as CountryCallingCode
    );
    const isPhoneEmpty = phoneValue === "";
    const isPhoneProvided = !isPhoneEmpty && !isPhoneJustCallingCode;

    // Ne email ne telefon varsa hata
    if (!isEmailProvided && !isPhoneProvided) {
      issues.push({
        code: "custom",
        input: value.email,
        message: "Email veya telefon numarası gereklidir",
        path: ["email"],
      });
      return;
    }

    // Telefon numarası varsa geçerli olup olmadığını kontrol et
    if (isPhoneProvided) {
      try {
        if (!isValidPhoneNumber(phoneValue)) {
          issues.push({
            code: "custom",
            input: value.phone,
            message: "Geçerli bir telefon numarası giriniz",
            path: ["phone"],
          });
        }
      } catch (error) {
        issues.push({
          code: "custom",
          input: value.phone,
          message: "Geçerli bir telefon numarası giriniz",
          path: ["phone"],
        });
      }
    }

    // Email varsa geçerli olup olmadığını kontrol et
    if (isEmailProvided) {
      const emailRegex = z.email();
      if (!emailRegex.safeParse(value.email!).success) {
        issues.push({
          code: "custom",
          input: value.email,
          message: "Geçerli bir email adresi giriniz",
          path: ["email"],
        });
      }
    }
  });

export type RegisterSchemaType = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("email"),
    email: z.email({
      message: "Geçerli bir email adresi giriniz",
    }),
    password: z
      .string()
      .min(6, {
        abort: true,
        message: "Şifre en az 6 karakter olmalıdır",
      })
      .max(50, {
        message: "Şifre en fazla 50 karakter olabilir",
      }),
  }),
  z.object({
    type: z.literal("phone"),
    phone: z.string().refine(
      (val) => {
        const isValidPhone = isValidPhoneNumber(val);
        if (!isValidPhone) {
          return false;
        }
        return true;
      },
      {
        message: "Geçerli bir telefon numarası giriniz",
      }
    ),
    password: z
      .string()
      .min(6, {
        abort: true,
        message: "Şifre en az 6 karakter olmalıdır",
      })
      .max(50, {
        message: "Şifre en fazla 50 karakter olabilir",
      }),
  }),
]);

export type LoginSchemaType = z.infer<typeof LoginSchema>;

export interface TokenPayload {
  id: string;
  name: string;
  verified: Date | null;
  role: $Enums.Role;
  email?: string;
  phone?: string;
}
