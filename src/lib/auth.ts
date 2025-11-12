import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { api } from "@/lib/axios";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          const { data } = await api.post("/login", {
            email: credentials?.email,
            password: credentials?.password,
          });
          console.log(credentials?.email);
          console.log(credentials?.password);

          if (!data?.user || !data?.token) return null;

          return {
            id: data.user.id.toString(),
            name: data.user.name,
            email: data.user.email,
            laravelToken: data.token, // Token do seu backend Laravel
          };
        } catch (error) {
          console.error("Erro no login:", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      async profile(profile) {
        // Opcional: Envie os dados do Google para seu backend Laravel
        const { data } = await api.post("/auth/google", {
          email: profile.email,
          name: profile.name,
          avatar: profile.picture,
          provider: "google",
          provider_id: profile.sub,
        });
 console.log("👀 Resposta do Laravel:", data);
        return {
          id: data.user.id.toString(),
          name: data.user.name,
          email: data.user.email,
          image: data.user.avatar,
          laravelToken: data.token, // Token do Laravel
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.laravelToken) {
        token.laravelToken = user.laravelToken; // Persiste o token do Laravel
      }
      return token;
    },
    async session({ session, token }) {
      session.laravelToken = token.laravelToken; // Disponibiliza na sessão
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 dia
  },
  pages: {
    signIn: "/login", // 👈 importante
  },
  secret: process.env.NEXTAUTH_SECRET!,
};
