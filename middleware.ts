import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

const authRoutes = ["/api/auth", "/register", "/login"];
const adminRoutes = ["/admin", "/api/admin"];
const userRoutes = ["/profile", "/api/user"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const userRole = req.auth?.user?.role;

  // 1. Giriş yapmış kullanıcılar auth route'larına erişemez
  if (isLoggedIn && authRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 2. Admin olmayan kullanıcılar admin route'larına erişemez
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

  // 3. Giriş yapmamış kullanıcılar user route'larına erişemez
  if (!isLoggedIn && userRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
