"use server";

import { Role } from "@/app/generated/prisma";
import { auth } from "./auth";

type Action =
  | "only_user"
  | "only_admin"
  | "only_owner"
  | "admin_owner"
  | "user_admin";

export async function checkRolesForActions(action: Action): Promise<boolean> {
  const session = await auth();

  if (!session) {
    return false;
  }

  const roles: Role[] = (() => {
    switch (action) {
      case "only_user":
        return [Role.USER];

      case "only_admin":
        return [Role.ADMIN];

      case "only_owner":
        return [Role.OWNER];

      case "admin_owner":
        return [Role.ADMIN, Role.OWNER];

      case "user_admin":
        return [Role.USER, Role.ADMIN];

      default:
        return [Role.ADMIN, Role.OWNER];
    }
  })();

  const userRole = session.user.role;
  return roles.includes(userRole);
}
