// src/middleware.ts
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // ============================================================
  // BLOQUEIO TEMPORÁRIO DA ROTA /exercicios
  // Só você consegue acessar. Todos os outros veem "Em construção"
  // ============================================================
  if (request.nextUrl.pathname.startsWith("/exercicios")) {
    // ←←← TROQUE AQUI PELO SEU E-MAIL DE DESENVOLVEDOR ←←←
    const EMAIL_DO_DEV = "maccabeus@gmail.com";   // <--- MUDE AQUI!!!

    // Se não estiver logado OU não for o dev → bloqueia
    if (!token || token.email !== EMAIL_DO_DEV) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Em construção</title>
            <style>
              body{margin:0;font-family:system-ui,sans-serif;background:#f3f4f6;height:100vh;display:flex;align-items:center;justify-content:center;}
              .card{background:white;padding:48px 32px;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,0.1);text-align:center;max-width:90%;}
              h1{font-size:2.8rem;margin:0 0 20px;color:#111827;}
              p{color:#6b7280;font-size:1.2rem;line-height:1.6;}
              .small{margin-top:32px;color:#9ca3af;font-size:0.95rem;}
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Em construção</h1>
              <p>A seção está sendo finalizada com muito carinho.</p>
              <p class="small">Volte em breve!</p>
            </div>
          </body>
        </html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html" },
        }
      );
    }
    // Se for você → continua normalmente (pula o bloqueio)
  }

  // ============================================================
  // Sua lógica original de autenticação (não mexi em nada)
  // ============================================================
  const publicRoutes = [
    "/login",
    "/terms",
    "/privacy",
    "/contact",
    "/definir-senha",
    "/magic-login",
  ];

  const isPublicPage = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Usuário não logado tentando acessar página protegida → vai pro login
  if (!token && !isPublicPage) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Usuário logado tentando entrar no /login → manda pra home
  if (token && request.nextUrl.pathname.startsWith("/login")) {
    const homeUrl = new URL("/home", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Tudo certo → continua
  return NextResponse.next();
}

// Aplica o middleware em todas as rotas exceto api, static, etc.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};