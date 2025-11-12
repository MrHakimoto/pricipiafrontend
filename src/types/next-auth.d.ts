// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    laravelToken?: string;
  }

  interface User {
    laravelToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    laravelToken?: string;
  }
}
