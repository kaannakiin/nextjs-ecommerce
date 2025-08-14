import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const authRoutes = ["/api/auth", "/register", "/login"];
const adminRoutes = ["/admin", "/api/admin"];
const userRoutes = ["/profile", "/api/user"];

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const userRole = req.auth?.user?.role;

  // Giriş yapmış kullanıcıları auth route'larından yönlendir
  if (isLoggedIn && authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Admin route kontrolü
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (userRole !== "ADMIN" && userRole !== "OWNER") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (pathname === "/admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
  }

  // Kullanıcı route kontrolü
  if (!isLoggedIn && userRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Auth kontrolü geçtikten sonra internationalization middleware'i çalıştır
  return intlMiddleware(req as NextRequest);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
