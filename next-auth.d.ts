import NextAuth from "next-auth";
import { Role } from "./app/generated/prisma";

declare module "next-auth" {
  interface User {
    role: Role;
    verified: boolean;
    email?: string | null;
    phone?: string | null;
    name: string;
    id: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email?: string | null;
      phone?: string | null;
      role: Role;
      verified: boolean;
    };
    expires: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    role: Role;
    verified: boolean;
    email?: string;
    phone?: string;
  }
}
