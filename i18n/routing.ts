import { Locale } from "@/app/generated/prisma";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: Object.values(Locale).map((locale) => locale.toLowerCase()),
  defaultLocale: "tr",
  domains: Object.values(Locale).map((locale) => ({
    domain: `${locale.toLocaleLowerCase()}.${process.env.NEXT_PUBLIC_AUTH_URL}`,
    defaultLocale: `${locale.toLocaleLowerCase()}`,
    locales: [locale.toLocaleLowerCase()],
  })),
  localePrefix: "never",
  localeCookie: {
    name: "localization",
  },
});
