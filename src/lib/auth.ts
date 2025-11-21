import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { api } from "@/lib/axios";
import type { NextAuthOptions } from "next-auth";
import { cookies } from "next/headers"; // 1. Importe cookies
import { decode } from "next-auth/jwt"; // 2. Importe decode

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
        // ... (seu código do CredentialsProvider continua igual) ...
        id: "credentials",
        name: "Credentials",
        credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Senha", type: "password" },
            laravelToken: { label: "Token", type: "text" }, 
        },
        async authorize(credentials) {
            // ... (seu código do authorize continua igual) ...
            // COPIE O CÓDIGO ANTERIOR AQUI
             if (credentials?.laravelToken) {
                // ... lógica do magic link ...
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
                    laravelToken: data.token,
                };
            } catch (error) {
                return null;
            }
        }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      async profile(profile) {
        
        // --- INÍCIO DA CORREÇÃO ---
        // Tenta recuperar o token da sessão atual para provar ao Laravel que estamos logados
        let tokenAtual = null;
        
        try {
            const cookieStore = cookies();
            // O nome do cookie muda se for produção (__Secure-) ou localhost
            const tokenCookie = cookieStore.get("next-auth.session-token")?.value || 
                                cookieStore.get("__Secure-next-auth.session-token")?.value;

            if (tokenCookie) {
                const decoded = await decode({
                    token: tokenCookie,
                    secret: process.env.NEXTAUTH_SECRET!,
                });
                // Pega o 'laravelToken' que salvamos na sessão
                tokenAtual = decoded?.laravelToken; 
            }
        } catch (e) {
            console.log("Não foi possível recuperar a sessão atual (usuário deslogado?)");
        }
        // --- FIM DA CORREÇÃO ---

        try {
          // Agora enviamos o token no Header!
          const { data } = await api.post("/auth/google", {
            email: profile.email,
            name: profile.name,
            avatar: profile.picture,
            provider: "google",
            provider_id: profile.sub,
          }, {
            // 🚨 AQUI ESTÁ O SEGREDO: Se tiver token, envia. Se não, vai vazio.
            headers: tokenAtual ? { 
                'Authorization': `Bearer ${tokenAtual}` 
            } : {}
          });

          // Se o Laravel retornou erro (ex: 409 Conflict), vai cair no catch abaixo.
          // Se chegou aqui, é sucesso.

          return {
            id: data.user.id.toString(),
            name: data.user.name,
            email: data.user.email,
            image: data.user.avatar,
            laravelToken: data.token,
          };

        } catch (error: any) {
          console.error("Erro no login Google:", error.response?.data?.message);
          
          // Se o backend recusou (ex: emails diferentes), lançamos erro para o NextAuth abortar
          throw new Error(error.response?.data?.message || "Falha na autenticação.");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.laravelToken) {
        token.laravelToken = user.laravelToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.laravelToken = token.laravelToken;
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/perfil", // Opcional: Redireciona para perfil em caso de erro (vinculo falhou)
  },
  secret: process.env.NEXTAUTH_SECRET!,
};