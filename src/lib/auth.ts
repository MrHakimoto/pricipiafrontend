import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { api } from "@/lib/axios";
import type { NextAuthOptions } from "next-auth";
import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // ... (Seu CredentialsProvider continua idêntico) ...
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        laravelToken: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.laravelToken) {
          try {
            const { data: user } = await api.get("/user", {
              headers: {
                Authorization: `Bearer ${credentials.laravelToken}`,
              },
            });
            if (!user) return null;
            return {
              id: user.id.toString(),
              name: user.name,
              email: user.email,
              image: user.avatar,
              laravelToken: credentials.laravelToken,
            };
          } catch (error) {
            return null;
          }
        }

        try {
          const { data } = await api.post("/login", {
            email: credentials?.email,
            password: credentials?.password,
          });
          if (!data?.user || !data?.token) return null;
          return {
            id: data.user.id.toString(),
            name: data.user.name,
            email: data.user.email,
            image: data.avatar,
            laravelToken: data.token,
          };
        } catch (error) {
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      async profile(profile) {
        let tokenAtual = null;

        try {
          // 🔥 CORREÇÃO: cookies() pode ser síncrono ou assíncrono dependendo da versão.
          // Para garantir compatibilidade, tratamos o resultado.
          const cookieStoreResult = cookies();

          // Se for uma Promise (Next.js 15+ ou canary), aguardamos. Se não, usamos direto.
          const cookieStore =
            cookieStoreResult instanceof Promise
              ? await cookieStoreResult
              : cookieStoreResult;

          const tokenCookie =
            cookieStore.get("next-auth.session-token")?.value ||
            cookieStore.get("__Secure-next-auth.session-token")?.value;

          if (tokenCookie) {
            const decoded = await decode({
              token: tokenCookie,
              secret: process.env.NEXTAUTH_SECRET!,
            });
            tokenAtual = decoded?.laravelToken;
          }
        } catch (e) {
          console.log(
            "Não foi possível recuperar a sessão atual (usuário deslogado?)"
          );
        }

        try {
          const { data } = await api.post(
            "/auth/google",
            {
              email: profile.email,
              name: profile.name,
              avatar: profile.picture,
              provider: "google",
              provider_id: profile.sub,
            },
            {
              headers: tokenAtual
                ? {
                    Authorization: `Bearer ${tokenAtual}`,
                  }
                : {},
            }
          );

          // Tratamento robusto para a resposta
          if (!data.user || !data.token) {
            throw new Error("Dados incompletos do backend.");
          }

          return {
            id: data.user.id.toString(),
            name: data.user.name,
            email: data.user.email,
            image: data.user.avatar,
            laravelToken: data.token,
          };
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Erro desconhecido no login Google.";
          console.error("Erro no login Google (Backend):", errorMessage);
          throw new Error(errorMessage);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1. Login Inicial (Mantém o que você já tem)
      if (user) {
        token.laravelToken = user.laravelToken;
        token.picture = user.image ?? null;
      }

      // 🔥 2. ATUALIZAÇÃO MANUAL (Novo Código)
      // Se o frontend chamar update(), o 'trigger' será "update"
      // e os dados novos virão em 'session'.
      if (trigger === "update" && session?.user) {
        token.picture = session.user.image ?? null; // ← ACEITA NULL
      }

      return token;
    },
    async session({ session, token }) {
      session.laravelToken = token.laravelToken;

      session.user.image = token.picture ?? null;
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/perfil",
  },
  secret: process.env.NEXTAUTH_SECRET!,
};
