//[...nextauth]/route.ts
import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

// Handler para as rotas de autenticação
const handler = NextAuth(authOptions);

// Exporta os métodos GET e POST necessários
export { handler as GET, handler as POST };