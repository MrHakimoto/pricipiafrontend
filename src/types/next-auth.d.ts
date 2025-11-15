import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    laravelToken?: string;
  }

  interface User extends DefaultUser {
    laravelToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    laravelToken?: string;
    id?: string;
  }
}